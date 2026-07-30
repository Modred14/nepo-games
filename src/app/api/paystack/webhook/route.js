// ORIGINAL ROUTE: src/app/api/paystack/webhook/route.js
// CHANGED (v2 — bugfix): Paystack webhook (event-per-type, HMAC-SHA512
// signature) -> Flutterwave webhook (single "charge.completed" /
// "transfer.completed" event, branched by data.status; signature is a
// direct string compare of the "verif-hash" header against your
// FLW_SECRET_HASH env var — Flutterwave does NOT use HMAC here, you just
// set an arbitrary secret string in the dashboard and they echo it back
// verbatim).
//
// ⚠️ BUGFIX in this version: the original routing logic guessed "is this an
// unprompted virtual-account deposit?" from `payment_type === "bank_transfer"
// && !meta.purpose`. In production, a real wallet-funding charge
// (tx_ref "wallet_76_...") paid via the bank-transfer option on Flutterwave's
// OWN checkout page got misrouted into the "unrecognized deposit" branch,
// silently failing to credit the wallet — because Flutterwave apparently
// doesn't always echo `meta` back the same way for bank_transfer charges.
//
// Fix: routing is now based on the tx_ref PREFIX instead (sub_, wallet_,
// tx_, tournament_ — all of which WE generate, so this is deterministic and
// can't be dropped by Flutterwave). And for any charge whose tx_ref matches
// one of our own prefixes, we now re-verify the transaction via Flutterwave's
// API (verify_by_reference) instead of trusting the webhook body's `meta`
// directly — so even if `meta` is ever missing/malformed on the webhook
// payload again, we still get the authoritative data straight from
// Flutterwave rather than silently misfiring.
//
// DB table names (paystack_webhook_events, paystack_unmatched_credits) were
// left AS-IS to avoid a migration — they're just internal table names now,
// not tied to Paystack specifically. Rename via migration later if you want.
import { NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { emitToRoom } from "@/lib/socket";
import { sendSellerWelcomeEmail } from "@/lib/emails/sendSellerWelcome";
import { sendAdminAlert } from "@/lib/emails/sendAdminAlert";

const OWN_TX_REF_PREFIXES = ["sub_", "wallet_", "tx_", "tournament_"];

function isOwnInitiatedTxRef(reference) {
  return !!reference && OWN_TX_REF_PREFIXES.some((p) => reference.startsWith(p));
}

// Derives the plan TIER from total days remaining (after rollover), rather
// than from whichever plan was just purchased. So buying "Pro" while 400
// days of a previous Plus/Premium purchase are still on the clock correctly
// keeps the account at Premium, instead of downgrading it.
//   > 365 days      -> premium
//   91–365 days     -> plus
//   1–90 days       -> pro
//   0 or fewer days -> free
function derivePlanFromDays(totalDays) {
  if (totalDays <= 0) return "free";
  if (totalDays <= 90) return "pro";
  if (totalDays <= 365) return "plus";
  return "premium";
}

// Re-fetch the authoritative transaction record from Flutterwave rather
// than trusting the webhook body's `meta`/`amount`/`status` blindly. This
// is what actually fixed the misrouting bug — the webhook payload isn't
// always fully reliable, but the verify endpoint is the source of truth.
async function verifyByReference(reference) {
  const res = await fetch(
    `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } },
  );
  const json = await res.json();
  if (json.status !== "success") return null;
  return json.data;
}

async function markProcessed(client, eventType, reference) {
  const res = await client.query(
    `INSERT INTO paystack_webhook_events (event_type, reference)
     VALUES ($1, $2)
     ON CONFLICT (event_type, reference) DO NOTHING
     RETURNING id`,
    [eventType, reference],
  );
  return res.rows.length > 0;
}

export async function POST(req) {
  console.log("🔥 FLUTTERWAVE WEBHOOK HIT");

  const rawBody = await req.text();

  try {
    const signature = req.headers.get("verif-hash");

    // Flutterwave: direct string compare against your configured secret
    // hash, NOT an HMAC digest. Still use timingSafeEqual to avoid leaking
    // timing information byte-by-byte.
    const expected = process.env.FLW_SECRET_HASH || "";
    const signatureBuffer = Buffer.from(signature || "", "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    const isValidSignature =
      expected.length > 0 &&
      signatureBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isValidSignature) {
      console.error("❌ Invalid Flutterwave signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (err) {
      console.error("❌ Invalid JSON from Flutterwave:", err);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const data = event.data;
    const reference = data?.tx_ref;

    // ─────────────────────────────────────────────
    // charge.completed — Virtual Account (bank transfer) funding
    // ─────────────────────────────────────────────
    // FIXED: this used to guess based on `payment_type === "bank_transfer"
    // && !meta.purpose`, which misfired on real wallet/subscription/
    // marketplace charges paid via the bank-transfer option (meta wasn't
    // reliably echoed back for that payment method). Now we check the
    // tx_ref prefix instead — deterministic, since we set every tx_ref
    // ourselves for anything we initiate.
    if (
      event?.event === "charge.completed" &&
      data?.payment_type === "bank_transfer" &&
      !isOwnInitiatedTxRef(reference)
    ) {
      // Doesn't match any of our own tx_ref prefixes — this is a genuine
      // unprompted inbound transfer straight into a customer's dedicated
      // virtual account, handled completely separately below.
      return handleVirtualAccountCharge(data, reference);
    }

    // ─────────────────────────────────────────────
    // charge.completed
    // ─────────────────────────────────────────────
    if (event?.event === "charge.completed") {
      // Don't trust the webhook body's `meta`/`amount`/`status` blindly —
      // re-verify against Flutterwave's API. This is what actually fixes
      // the misrouting bug: even if `meta` is dropped/malformed on the
      // webhook payload (as happened with bank-transfer-paid checkouts),
      // the verify endpoint still returns the authoritative record.
      const verified = isOwnInitiatedTxRef(reference)
        ? await verifyByReference(reference)
        : null;
      const source = verified || data;

      const metadata = source?.meta || {};
      const userId = metadata?.userId;
      const purpose = metadata?.purpose;
      const amount = Number(source.amount); // Flutterwave amount is already in naira
      const sellerAmount = amount;
      const isSuccessful = (verified ? verified.status : data?.status) === "successful";

      if (!reference || !userId || !purpose) {
        console.error("❌ Missing critical data:", data);
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 },
        );
      }

      const userRes = await pool.query(
        "SELECT id, email FROM users WHERE id = $1",
        [userId],
      );
      const user = userRes.rows[0];

      if (!user) {
        console.error("❌ User not found:", userId);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // ── FAILED CHARGE ────────────────────────────
      // Flutterwave doesn't send a separate "charge.failed" event — the
      // same "charge.completed" event fires with data.status === "failed".
      if (!isSuccessful) {
        return handleFailedCharge(purpose, metadata, userId, amount, reference);
      }

      // ── MARKETPLACE ──────────────────────────────
      if (purpose === "marketplace") {
        console.log("WEBHOOK EVENT HIT");
        const transactionId = metadata.transaction_id;
        const listingId = metadata.listing_id;

        if (!transactionId || !listingId) {
          console.error("❌ Missing transaction metadata");
          return NextResponse.json(
            { error: "Missing metadata" },
            { status: 400 },
          );
        }

        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          const isNew = await markProcessed(client, "charge.success.marketplace", reference);
          if (!isNew) {
            await client.query("ROLLBACK");
            console.log("⚠️ Duplicate marketplace webhook ignored:", reference);
            return NextResponse.json({ status: "already processed" });
          }

          const txRes = await client.query(
            `SELECT * FROM transactions WHERE id = $1 FOR UPDATE`,
            [transactionId],
          );
          const transaction = txRes.rows[0];

          if (!transaction) {
            await client.query("ROLLBACK");
            console.error("❌ Transaction not found:", transactionId);
            return NextResponse.json(
              { error: "Transaction not found" },
              { status: 404 },
            );
          }

          if (transaction.payment_status === "paid") {
            await client.query("ROLLBACK");
            console.log("⚠️ Already processed:", transactionId);
            return NextResponse.json({ status: "already processed" });
          }

          await client.query(
            `UPDATE transactions
             SET
               payment_status = 'paid',
               transaction_status = 'pending',
               escrow_status = 'holding',
               payment_provider_response = $1,
               updated_at = NOW()
             WHERE id = $2`,
            [JSON.stringify(source), transactionId],
          );

          await client.query(
            `UPDATE listings SET status = 'pending' WHERE id = $1`,
            [listingId],
          );

          // await client.query(
          //   `INSERT INTO users_transactions
          //    (user_id, type, amount, status, description, reference)
          //    VALUES ($1, 'credit', $2, 'success', 'Wallet funding', $3)`,
          //   [transaction.buyer_id, amount, reference],
          // );
          // FIX (critical): this row records the card/Flutterwave payment
          // for the buyer's own transaction HISTORY — it is not money that
          // ever sat in or left their in-app wallet. It was previously
          // summed into their wallet balance like any other debit, which
          // silently (and incorrectly) reduced — sometimes below zero —
          // a buyer's real, spendable wallet balance every time they paid
          // by card instead of by wallet. affects_balance = false keeps it
          // visible in transaction history without touching the balance.
          // See balance queries in user/account/route.js,
          // user/withdraw/route.js, and paystack/buy/initialize/route.js.
          await client.query(
            `INSERT INTO users_transactions
             (user_id, type, amount, status, description, reference, affects_balance)
             VALUES ($1, 'debit', $2, 'success', 'Game account purchase', $3, false)`,
            [transaction.buyer_id, amount, reference],
          );

          await client.query(
            `INSERT INTO users_transactions
             (user_id, type, amount, status, description, reference, affects_balance)
             VALUES ($1, 'credit', $2, 'pending', 'Game account purchase', $3, true)`,
            [transaction.seller_id, sellerAmount, reference],
          );

          const platformFee = amount * 0.05;
          await client.query(
            `INSERT INTO users_transactions
             (user_id, type, amount, status, description, reference, affects_balance)
             VALUES ($1, 'debit', $2, 'pending', 'Listing fee', $3, true)`,
            [transaction.seller_id, platformFee, reference],
          );
          await client.query(
            `INSERT INTO users_transactions
             (user_id, type, amount, status, description, reference, affects_balance)
             VALUES ($1, 'credit', $2, 'pending', 'Platform fee', $3, true)`,
            [1, platformFee, reference],
          );

          const convRes = await client.query(
            `SELECT id FROM conversations WHERE listing_id = $1 LIMIT 1`,
            [listingId],
          );
          let paymentMsg = null;
          if (convRes.rows.length > 0) {
            const msgRes = await client.query(
              `INSERT INTO messages
               (conversation_id, sender_id, message, type, created_at)
               VALUES ($1, 1, 'Buyer has made payment. Seller should kindly provide login details.', 'payment_made', NOW())
               RETURNING *`,
              [convRes.rows[0].id],
            );
            paymentMsg = msgRes.rows[0];
          } else {
            console.warn(
              "⚠️ No conversation found for listing, skipping system message:",
              listingId,
            );
          }

          await client.query("COMMIT");
          console.log("✅ Marketplace payment processed:", transactionId);

          // FIX: this message was being inserted but never broadcast, so
          // the seller only saw "Buyer has made payment..." after a manual
          // refresh instead of live like every other message in the app
          // (senddetails/confirm/dispute all emit — this webhook was the
          // one path that didn't).
          if (paymentMsg) {
            await emitToRoom(
              `room:${convRes.rows[0].id}`,
              "new_message",
              paymentMsg,
            );
          }
          await emitToRoom(`user:${transaction.buyer_id}`, "sidebar_update", {});
          await emitToRoom(`user:${transaction.seller_id}`, "sidebar_update", {});

          return NextResponse.json({ status: "marketplace payment processed" });
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        } finally {
          client.release();
        }
      }

      // ── WALLET ───────────────────────────────────
      if (purpose === "wallet") {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          const isNew = await markProcessed(client, "charge.success.wallet", reference);
          if (!isNew) {
            await client.query("ROLLBACK");
            console.log("⚠️ Duplicate webhook ignored:", reference);
            return NextResponse.json({ status: "already processed" });
          }

          const requestedAmount = Number(metadata?.requestedAmount);
          const creditAmount = requestedAmount > 0 ? requestedAmount : amount;

          await client.query(
            `INSERT INTO users_transactions (user_id, type, amount, status, description, reference, affects_balance)
             VALUES ($1, 'credit', $2, 'success', 'Wallet funding', $3, true)`,
            [userId, creditAmount, reference],
          );

          await client.query("COMMIT");
          console.log("💰 Wallet funded:", creditAmount);
          return NextResponse.json({ status: "wallet credited" });
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        } finally {
          client.release();
        }
      }

      // ── SUBSCRIPTION ─────────────────────────────
      if (purpose === "subscription") {
        // NOTE: these are now naira amounts (Flutterwave), not kobo — match
        // the naira values used in the updated /paystack/initialize/route.js.
        const PLAN_BY_AMOUNT = {
          2900: { plan: "pro", days: 30, label: "1 month" },
          8500: { plan: "plus", days: 90, label: "3 months" },
          32000: { plan: "premium", days: 365, label: "12 months" },
        };

        const planData = PLAN_BY_AMOUNT[amount];
        if (!planData) {
          console.error("❌ Invalid amount:", amount);
          return NextResponse.json(
            { error: "Invalid amount" },
            { status: 400 },
          );
        }

        const { days, label } = planData;

        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          const isNew = await markProcessed(client, "charge.success.subscription", reference);
          if (!isNew) {
            await client.query("ROLLBACK");
            console.log("⚠️ Duplicate subscription webhook ignored:", reference);
            return NextResponse.json({ status: "already processed" });
          }

          await client.query(
            `INSERT INTO payments (user_id, amount, reference, status)
             VALUES ($1, $2, $3, $4)`,
            [userId, amount, reference, "success"],
          );
          // await client.query(
          //   `INSERT INTO users_transactions (user_id, type, amount, status, description, reference)
          //    VALUES ($1, 'credit', $2, 'success', 'Subscription payment', $3)`,
          //   [userId, amount, reference],
          // );
          // FIX: subscriptions are always paid by card/Flutterwave — there is
          // no wallet path for this purpose — so this debit row is pure
          // transaction history and must not reduce the user's wallet
          // balance. Same category of bug as the marketplace fix above.
          await client.query(
            `INSERT INTO users_transactions (user_id, type, amount, status, description, reference, affects_balance)
             VALUES ($1, 'debit', $2, 'success', 'Subscription payment', $3, false)`,
            [userId, amount, reference],
          );

          // Roll over remaining time, THEN derive the plan tier from the
          // TOTAL days left (not from whatever plan was just purchased) —
          // e.g. buying Pro while 400 days of Plus/Premium are still
          // remaining should land on Premium, not silently downgrade to Pro.
          const existingRes = await client.query(
            `SELECT subscription_end FROM users WHERE id = $1 FOR UPDATE`,
            [userId],
          );
          const now = new Date();
          const currentEnd = existingRes.rows[0]?.subscription_end;
          const startFrom = currentEnd && new Date(currentEnd) > now ? new Date(currentEnd) : now;
          const end = new Date(startFrom);
          end.setDate(end.getDate() + days);

          const totalDaysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
          const finalPlan = derivePlanFromDays(totalDaysRemaining);

          await client.query(
            `UPDATE users
             SET
               plan = $1,
               subscription_status = 'active',
               subscription_start = NOW(),
               subscription_end = $2,
               paystack_reference = $3
             WHERE id = $4`,
            [finalPlan, end, reference, userId],
          );

          await client.query("COMMIT");

          sendSellerWelcomeEmail(label, user.email, finalPlan)
            .then(() => console.log("📧 Email sent"))
            .catch((err) => console.error("❌ Email failed:", err));

          return NextResponse.json({ status: "subscription activated" });
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        } finally {
          client.release();
        }
      }

      // ── TOURNAMENT ───────────────────────────────
      if (purpose === "tournament") {
        console.log("🏆 TOURNAMENT WEBHOOK HIT");

        const tournament_id = metadata.tournament_id;
        const player_name = metadata.player_name;
        const player_email = metadata.player_email;

        if (!tournament_id || !player_name || !player_email) {
          console.error("❌ Missing tournament metadata");
          return NextResponse.json(
            { error: "Missing metadata" },
            { status: 400 },
          );
        }

        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          const isNew = await markProcessed(client, "charge.success.tournament", reference);
          if (!isNew) {
            await client.query("ROLLBACK");
            console.log("⚠️ Duplicate tournament webhook ignored:", reference);
            return NextResponse.json({ status: "already processed" });
          }

          const { rows } = await client.query(
            `SELECT slots_left FROM tournaments WHERE id = $1 FOR UPDATE`,
            [tournament_id],
          );
          if (!rows[0] || rows[0].slots_left <= 0) {
            await client.query("ROLLBACK");
            console.error("❌ No slots left for tournament:", tournament_id);
            return NextResponse.json(
              { error: "No slots available" },
              { status: 400 },
            );
          }

          await client.query(
            `INSERT INTO tournament_contestants
             (tournament_id, user_id, player_name, email, payment_ref, payment_status)
             VALUES ($1, $2, $3, $4, $5, 'confirmed')`,
            [tournament_id, userId, player_name, player_email, reference],
          );

          await client.query(
            `UPDATE tournaments SET slots_left = slots_left - 1 WHERE id = $1`,
            [tournament_id],
          );

          // FIX: this used to insert BOTH a 'credit' and a 'debit' row for
          // the same user/amount/reference (a leftover credit-then-debit
          // pair that canceled out in the balance sum, same root issue as
          // the marketplace/subscription fixes above). Tournament entry is
          // always paid by card/Flutterwave — there's no wallet path — so
          // this should only ever be a history-only debit, same as
          // subscription payments.
          await client.query(
            `INSERT INTO users_transactions
             (user_id, type, amount, status, description, reference, affects_balance)
             VALUES ($1, 'debit', $2, 'success', 'Tournament registration', $3, false)`,
            [userId, amount, reference],
          );

          await client.query("COMMIT");
          console.log(
            "✅ Tournament registration confirmed:",
            userId,
            tournament_id,
          );
          return NextResponse.json({
            status: "tournament registration confirmed",
          });
        } catch (err) {
          await client.query("ROLLBACK");
          console.error("❌ TOURNAMENT DB ERROR:", err.message, err.stack);
          throw err;
        } finally {
          client.release();
        }
      }
    }

    // ─────────────────────────────────────────────
    // transfer.completed
    // ─────────────────────────────────────────────
    if (event.event === "transfer.completed") {
      const status = data?.status; // "SUCCESSFUL" | "FAILED"

      if (status === "SUCCESSFUL") {
        const existing = await pool.query(
          "SELECT id, status FROM users_transactions WHERE reference = $1",
          [reference],
        );

        if (existing.rows.length > 0 && existing.rows[0].status === "success") {
          console.log("⚠️ Duplicate transfer.completed webhook ignored:", reference);
          return NextResponse.json({ status: "already processed" });
        }

        await pool.query(
          `UPDATE users_transactions SET status = 'success' WHERE reference = $1`,
          [reference],
        );

        return NextResponse.json({ status: "withdrawal success updated" });
      }

      if (status === "FAILED") {
        await pool.query(
          `UPDATE users_transactions SET status = 'failed' WHERE reference = $1`,
          [reference],
        );
        return NextResponse.json({ status: "withdrawal failed updated" });
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("🔥 WEBHOOK CRASH:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────
// charge.completed with status "failed" — replaces Paystack's separate
// "charge.failed" event, since Flutterwave folds both outcomes into
// "charge.completed" and distinguishes via data.status.
// ─────────────────────────────────────────────
async function handleFailedCharge(purpose, metadata, userId, amount, reference) {
  if (purpose === "marketplace") {
    const transactionId = metadata.transaction_id;
    const listingId = metadata.listing_id;

    if (!transactionId || !listingId) {
      console.error("❌ Missing transaction metadata on failed charge");
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const txRes = await pool.query(
      `SELECT * FROM transactions WHERE id = $1`,
      [transactionId],
    );
    const transaction = txRes.rows[0];

    if (!transaction) {
      console.error("❌ Transaction not found on failed charge:", transactionId);
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (transaction.payment_status === "paid") {
      console.log(
        "⚠️ charge.completed(failed) received but transaction already paid, ignoring:",
        transactionId,
      );
      return NextResponse.json({ status: "already processed" });
    }

    await pool.query(
      `UPDATE listings SET status = 'active', processing_by = NULL WHERE id = $1`,
      [listingId],
    );
    await pool.query(
      `UPDATE transactions
       SET
         payment_status = 'failed',
         transaction_status = 'cancelled',
         payment_provider_response = $1,
         updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(metadata), transactionId],
    );

    console.log("❌ Marketplace payment failed, listing restored:", listingId);
    return NextResponse.json({
      status: "marketplace payment failed, listing restored",
    });
  }

  if (purpose === "wallet") {
    console.log("❌ Wallet funding failed for user:", userId, "amount:", amount);
    return NextResponse.json({
      status: "wallet charge failed, nothing to rollback",
    });
  }

  if (purpose === "subscription") {
    const existing = await pool.query(
      "SELECT id FROM users_transactions WHERE reference = $1",
      [reference],
    );
    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE users_transactions SET status = 'failed' WHERE reference = $1`,
        [reference],
      );
    }

    await pool.query(
      `UPDATE users
       SET subscription_status = CASE
         WHEN subscription_end > NOW() THEN 'active'
         ELSE 'inactive'
       END
       WHERE id = $1`,
      [userId],
    );

    console.log("❌ Subscription payment failed for user:", userId);
    return NextResponse.json({ status: "subscription charge failed" });
  }

  if (purpose === "tournament") {
    console.log(
      "❌ Tournament payment failed for user:",
      userId,
      "tournament:",
      metadata.tournament_id,
    );
    return NextResponse.json({
      status: "tournament charge failed, nothing to rollback",
    });
  }

  console.log("❌ Charge failed for unknown purpose:", purpose);
  return NextResponse.json({ status: "charge failed logged" });
}

// ─────────────────────────────────────────────
// Virtual Account (bank transfer) crediting
// ─────────────────────────────────────────────
// ⚠️ See the file-level note at the top — confirm this matching logic
// against a real Flutterwave sandbox virtual-account transfer before relying
// on it live. We match on data.customer.email since Flutterwave virtual
// accounts are created per-customer (unlike Paystack's per-account-number
// lookup), falling back to nothing/flagging for manual reconciliation if
// that customer isn't recognised.
async function handleVirtualAccountCharge(data, reference) {
  const customerEmail = data?.customer?.email;
  const amount = Number(data?.amount || 0);

  if (!reference || !customerEmail || !amount) {
    console.error("❌ Virtual account charge missing required fields:", data);
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const dedupe = await client.query(
      `INSERT INTO paystack_webhook_events (event_type, reference)
       VALUES ('charge.success.dva', $1)
       ON CONFLICT (event_type, reference) DO NOTHING
       RETURNING id`,
      [reference],
    );

    if (dedupe.rows.length === 0) {
      await client.query("ROLLBACK");
      console.log("⚠️ Duplicate virtual account webhook ignored:", reference);
      return NextResponse.json({ status: "already processed" });
    }

    const vaRes = await client.query(
      `SELECT uva.user_id
       FROM user_virtual_accounts uva
       JOIN users u ON u.id = uva.user_id
       WHERE u.email = $1 AND uva.active = true
       FOR UPDATE`,
      [customerEmail],
    );
    const virtualAccount = vaRes.rows[0];

    if (!virtualAccount) {
      await client.query(
        `INSERT INTO paystack_unmatched_credits (reference, account_number, amount, raw_payload)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (reference) DO NOTHING`,
        [reference, customerEmail, amount, JSON.stringify(data)],
      );
      await client.query("COMMIT");
      console.error(
        "🚨 Virtual account charge for unrecognised customer, flagged for reconciliation:",
        customerEmail,
        "ref:",
        reference,
      );

      sendAdminAlert("Unrecognised virtual account credit — needs manual reconciliation", {
        reference,
        customerEmail,
        amount,
      }).catch((err) => console.error("❌ Admin alert email failed:", err));

      return NextResponse.json({ status: "unrecognised account, flagged" });
    }

    await client.query(
      `INSERT INTO users_transactions (user_id, type, amount, status, description, reference, affects_balance)
       VALUES ($1, 'credit', $2, 'success', 'Bank transfer funding', $3, true)`,
      [virtualAccount.user_id, amount, reference],
    );

    await client.query("COMMIT");
    console.log("💰 Virtual account wallet funded:", virtualAccount.user_id, amount);
    return NextResponse.json({ status: "virtual account wallet credited" });
  } catch (err) {
    await client.query("ROLLBACK");
    // Log enough to manually reconcile from logs alone if this crashes —
    // this is exactly what was missing when the varchar(20) column-size
    // bug hit in production and the customer/amount weren't in the log line.
    console.error("❌ Virtual account webhook error:", err);
    console.error("❌ Context — reference:", reference, "amount:", amount, "customerEmail:", customerEmail);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}