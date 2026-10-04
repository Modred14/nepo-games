// ROUTE: src/app/api/paystack/webhook/route.js
//
// Flutterwave webhook (the folder is still named "paystack" for historical
// reasons; DB tables paystack_webhook_events / paystack_unmatched_credits are
// likewise only legacy names).
//
// SECURITY MODEL (audit hardening):
//  1. `verif-hash` header must match FLW_SECRET_HASH (constant-time compare).
//  2. The webhook body is NEVER trusted for money decisions. Every charge is
//     re-fetched from Flutterwave (verify_by_reference / verify by id) and the
//     VERIFIED record is used. If Flutterwave can't be reached we answer 503
//     so the provider retries — we do not fall back to the webhook body.
//  3. What a payment was for is derived from OUR tx_ref (which only the server
//     generates), not from client-influenceable metadata.
//  4. Verified status, currency (NGN), tx_ref equality and the AMOUNT are
//     checked against what the server expects (transactions.amount for
//     marketplace orders, the server price list for subscriptions, ...).
//  5. Every effect is idempotent (markProcessed inside the same DB
//     transaction), so duplicate/replayed webhooks cannot credit twice.
//  6. Money that arrives but cannot be applied (late payment on a cancelled
//     order, listing no longer reserved, ...) is credited to the buyer's
//     wallet and an admin is alerted — never silently dropped, never used to
//     resurrect a cancelled order.
import { NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { emitToRoom } from "@/lib/socket";
import { sendSellerWelcomeEmail } from "@/lib/emails/sendSellerWelcome";
import { sendAdminAlert } from "@/lib/emails/sendAdminAlert";
import { checkFlutterwaveTransferStatus } from "@/lib/flutterwaveTransfer";
import { getSetting } from "@/lib/settings";
import { PLAN_PRICES, applySubscriptionPayment } from "@/lib/subscriptions";
import {
  verifyByReference,
  verifyById,
  markProcessed,
  parseTxRef,
  creditWalletRefund,
} from "@/lib/flutterwaveVerify";

const PLAN_LABELS = { pro: "1 month", plus: "3 months", premium: "12 months" };

function ok(status) {
  return NextResponse.json({ status });
}

function alertAdmin(subject, details) {
  sendAdminAlert(subject, details).catch((err) =>
    console.error("Admin alert email failed:", err.message),
  );
}

// Buyer + seller conversation for a listing (NOT just "any conversation on
// this listing" — other prospective buyers have their own conversations).
async function findConversation(client, listingId, buyerId, sellerId) {
  const res = await client.query(
    `SELECT id FROM conversations
      WHERE listing_id = $1
        AND ((sender_id = $2 AND receiver_id = $3)
          OR (sender_id = $3 AND receiver_id = $2))
      LIMIT 1`,
    [listingId, buyerId, sellerId],
  );
  return res.rows[0]?.id ?? null;
}

export async function POST(req) {
  const rawBody = await req.text();

  try {
    // ── 1. Authenticate the webhook ──────────────────────────────────────
    const signature = req.headers.get("verif-hash");
    const expected = process.env.FLW_SECRET_HASH || "";
    const signatureBuffer = Buffer.from(signature || "", "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    const isValidSignature =
      expected.length > 0 &&
      signatureBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isValidSignature) {
      console.error("Webhook rejected: invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let event;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const data = event?.data;
    const reference = data?.tx_ref;

    // ── charge.completed ─────────────────────────────────────────────────
    if (event?.event === "charge.completed") {
      const parsed = parseTxRef(reference);

      // Not one of our own references: an unprompted bank transfer into a
      // customer's dedicated virtual account.
      if (!parsed) {
        if (data?.payment_type === "bank_transfer") {
          return handleVirtualAccountCharge(data, reference);
        }
        console.warn("charge.completed with unrecognised tx_ref ignored");
        return ok("ignored");
      }

      // Re-verify with Flutterwave. Never fall back to the webhook body.
      const verification = await verifyByReference(reference);
      if (verification.status === "error") {
        return NextResponse.json({ error: "Could not verify payment" }, { status: 503 });
      }
      if (verification.status === "notfound") {
        console.error("Webhook reference not found at Flutterwave:", reference);
        return NextResponse.json({ error: "Payment not found" }, { status: 503 });
      }

      const verified = verification.data;

      if (verified.tx_ref !== reference) {
        console.error("Verified tx_ref does not match webhook reference");
        return NextResponse.json({ error: "Reference mismatch" }, { status: 400 });
      }

      const flwStatus = String(verified.status || "").toLowerCase();
      if (flwStatus === "failed") {
        return handleFailedCharge(parsed, reference);
      }
      if (flwStatus !== "successful") {
        return ok("not final, ignored");
      }
      if (String(verified.currency || "").toUpperCase() !== "NGN") {
        console.error("Rejected non-NGN payment for reference:", reference);
        alertAdmin("Payment received in unexpected currency", {
          reference,
          currency: verified.currency,
          amount: verified.amount,
        });
        return ok("currency rejected");
      }

      const amount = Number(verified.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }

      if (parsed.purpose === "marketplace") {
        return handleMarketplacePayment(parsed, verified, reference, amount);
      }
      if (parsed.purpose === "wallet") {
        return handleWalletPayment(parsed, verified, reference, amount);
      }
      if (parsed.purpose === "subscription") {
        return handleSubscriptionPayment(parsed, reference, amount);
      }
      if (parsed.purpose === "tournament") {
        return handleTournamentPayment(parsed, reference, amount);
      }
      return ok("ignored");
    }

    // ── transfer.completed (withdrawal outcome) ──────────────────────────
    if (event?.event === "transfer.completed") {
      const transferId = data?.id;
      const transferRef = data?.reference;

      // Only our own withdrawals.
      if (typeof transferRef !== "string" || !transferRef.startsWith("WD_")) {
        return ok("ignored");
      }

      const existing = await pool.query(
        "SELECT id, status FROM users_transactions WHERE reference = $1",
        [transferRef],
      );
      if (existing.rows.length > 0 && existing.rows[0].status === "success") {
        return ok("already processed");
      }

      // Re-fetch the transfer from Flutterwave (via the whitelisted-IP
      // service) instead of trusting data.status in the webhook body.
      const verification = await checkFlutterwaveTransferStatus(
        transferId ? { id: transferId } : { reference: transferRef },
      );

      if (verification.ambiguous) {
        return NextResponse.json(
          { error: "Could not verify transfer status" },
          { status: 503 },
        );
      }

      const verifiedStatus = verification.found
        ? String(verification.data?.status || "").toUpperCase()
        : "FAILED";

      if (verifiedStatus === "SUCCESSFUL") {
        await pool.query(
          `UPDATE users_transactions SET status = 'success'
            WHERE reference = $1 AND status IN ('pending', 'unknown')`,
          [transferRef],
        );
        return ok("withdrawal success updated");
      }
      if (verifiedStatus === "FAILED") {
        await pool.query(
          `UPDATE users_transactions SET status = 'failed'
            WHERE reference = $1 AND status IN ('pending', 'unknown')`,
          [transferRef],
        );
        return ok("withdrawal failed updated");
      }
      return ok("withdrawal still pending");
    }

    return ok("ok");
  } catch (err) {
    console.error("WEBHOOK ERROR:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Marketplace order paid
// ─────────────────────────────────────────────────────────────────────────
async function handleMarketplacePayment(parsed, verified, reference, amount) {
  const client = await pool.connect();
  let notify = null;
  try {
    await client.query("BEGIN");

    const isNew = await markProcessed(client, "charge.success.marketplace", reference);
    if (!isNew) {
      await client.query("ROLLBACK");
      return ok("already processed");
    }

    const txRes = await client.query(
      `SELECT * FROM transactions WHERE id = $1 FOR UPDATE`,
      [parsed.transactionId],
    );
    const transaction = txRes.rows[0];

    // Money arrived for an order we cannot find / that does not belong to this
    // payment: park it for manual reconciliation instead of guessing.
    if (!transaction || transaction.payment_reference !== reference) {
      await client.query(
        `INSERT INTO paystack_unmatched_credits (reference, account_number, amount, raw_payload)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (reference) DO NOTHING`,
        [reference, "marketplace-unmatched", amount, JSON.stringify(verified)],
      );
      await client.query("COMMIT");
      alertAdmin("Marketplace payment could not be matched to an order", {
        reference,
        amount,
        transactionId: parsed.transactionId,
      });
      return ok("unmatched, flagged");
    }

    if (transaction.payment_status === "paid") {
      await client.query("ROLLBACK");
      return ok("already processed");
    }

    const listingRes = await client.query(
      `SELECT * FROM listings WHERE id = $1 FOR UPDATE`,
      [transaction.listing_id],
    );
    const listing = listingRes.rows[0];

    const expectedAmount = Number(transaction.amount);
    const orderStillValid =
      transaction.payment_status === "pending" &&
      transaction.transaction_status === "initiated" &&
      listing &&
      listing.status === "processing" &&
      Number(listing.processing_by) === Number(transaction.buyer_id) &&
      !listing.deleted_at &&
      amount + 0.001 >= expectedAmount;

    if (!orderStillValid) {
      // Late payment on a cancelled/expired order, wrong amount, or the
      // listing is no longer reserved for this buyer. Do NOT mark the order
      // paid. Return the money to the buyer's wallet and tell an admin.
      await creditWalletRefund(
        client,
        transaction.buyer_id,
        amount,
        reference,
        "Refund: payment received for an order that is no longer available",
      );
      await client.query("COMMIT");
      alertAdmin("Marketplace payment refunded to wallet (order no longer valid)", {
        reference,
        amount,
        expectedAmount,
        transactionId: transaction.id,
        transaction_status: transaction.transaction_status,
        payment_status: transaction.payment_status,
      });
      await emitToRoom(`user:${transaction.buyer_id}`, "sidebar_update", {});
      return ok("refunded to wallet");
    }

    await client.query(
      `UPDATE transactions
          SET payment_status = 'paid',
              transaction_status = 'pending',
              escrow_status = 'holding',
              payment_provider_response = $1,
              updated_at = NOW()
        WHERE id = $2`,
      [JSON.stringify(verified), transaction.id],
    );

    await client.query(`UPDATE listings SET status = 'pending' WHERE id = $1`, [
      transaction.listing_id,
    ]);

    // History-only row for the buyer (card payment never touched the wallet).
    await client.query(
      `INSERT INTO users_transactions
         (user_id, type, amount, status, description, reference, affects_balance)
       VALUES ($1, 'debit', $2, 'success', 'Game account purchase', $3, false)`,
      [transaction.buyer_id, expectedAmount, reference],
    );

    await client.query(
      `INSERT INTO users_transactions
         (user_id, type, amount, status, description, reference, affects_balance)
       VALUES ($1, 'credit', $2, 'pending', 'Game account purchase', $3, true)`,
      [transaction.seller_id, expectedAmount, reference],
    );

    const sellerFeePercent = await getSetting("seller_fee_percent");
    const platformFee = Math.round(expectedAmount * Number(sellerFeePercent)) / 100;
    await client.query(
      `INSERT INTO users_transactions
         (user_id, type, amount, status, description, reference, affects_balance)
       VALUES ($1, 'debit', $2, 'pending', 'Listing fee', $3, true)`,
      [transaction.seller_id, platformFee, reference],
    );
    await client.query(
      `INSERT INTO users_transactions
         (user_id, type, amount, status, description, reference, affects_balance)
       VALUES (1, 'credit', $1, 'pending', 'Platform fee', $2, true)`,
      [platformFee, reference],
    );

    const conversationId = await findConversation(
      client,
      transaction.listing_id,
      transaction.buyer_id,
      transaction.seller_id,
    );
    let paymentMsg = null;
    if (conversationId) {
      const msgRes = await client.query(
        `INSERT INTO messages (conversation_id, sender_id, message, type, created_at)
         VALUES ($1, 1, 'Buyer has made payment. Seller should kindly provide login details.', 'payment_made', NOW())
         RETURNING *`,
        [conversationId],
      );
      paymentMsg = msgRes.rows[0];
    }

    await client.query("COMMIT");
    notify = { paymentMsg, conversationId, transaction };
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    throw err;
  } finally {
    client.release();
  }

  if (notify) {
    if (notify.paymentMsg) {
      await emitToRoom(`room:${notify.conversationId}`, "new_message", notify.paymentMsg);
    }
    await emitToRoom(`user:${notify.transaction.buyer_id}`, "sidebar_update", {});
    await emitToRoom(`user:${notify.transaction.seller_id}`, "sidebar_update", {});
  }
  return ok("marketplace payment processed");
}

// ─────────────────────────────────────────────────────────────────────────
// Wallet funding
// ─────────────────────────────────────────────────────────────────────────
async function handleWalletPayment(parsed, verified, reference, amount) {
  // The user comes from our own tx_ref; cross-check the metadata if present.
  const metaUserId = verified?.meta?.userId;
  if (metaUserId != null && Number(metaUserId) !== parsed.userId) {
    console.error("Wallet payment: tx_ref user does not match metadata user");
    return NextResponse.json({ error: "User mismatch" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userRes = await client.query(`SELECT id FROM users WHERE id = $1`, [
      parsed.userId,
    ]);
    if (!userRes.rows[0]) {
      await client.query("ROLLBACK");
      alertAdmin("Wallet payment for unknown user", { reference, amount });
      return ok("unknown user, flagged");
    }

    const isNew = await markProcessed(client, "charge.success.wallet", reference);
    if (!isNew) {
      await client.query("ROLLBACK");
      return ok("already processed");
    }

    // Credit what was ACTUALLY charged (verified), never more than the
    // amount the user asked to add.
    const requested = Number(verified?.meta?.requestedAmount);
    const creditAmount =
      Number.isFinite(requested) && requested > 0 ? Math.min(requested, amount) : amount;

    await client.query(
      `INSERT INTO users_transactions
         (user_id, type, amount, status, description, reference, affects_balance)
       VALUES ($1, 'credit', $2, 'success', 'Wallet funding', $3, true)`,
      [parsed.userId, creditAmount, reference],
    );

    await client.query("COMMIT");
    return ok("wallet credited");
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    throw err;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Subscription
// ─────────────────────────────────────────────────────────────────────────
async function handleSubscriptionPayment(parsed, reference, amount) {
  const expected = PLAN_PRICES[parsed.plan];
  if (!expected || Math.round(amount) !== expected) {
    console.error("Subscription payment amount mismatch for", reference);
    alertAdmin("Subscription payment amount mismatch — not activated", {
      reference,
      plan: parsed.plan,
      expected,
      received: amount,
    });
    return ok("amount mismatch, flagged");
  }

  const client = await pool.connect();
  let email = null;
  let finalPlan = null;
  try {
    await client.query("BEGIN");

    const userRes = await client.query(`SELECT id, email FROM users WHERE id = $1`, [
      parsed.userId,
    ]);
    const user = userRes.rows[0];
    if (!user) {
      await client.query("ROLLBACK");
      alertAdmin("Subscription payment for unknown user", { reference, amount });
      return ok("unknown user, flagged");
    }

    const result = await applySubscriptionPayment(client, {
      userId: parsed.userId,
      plan: parsed.plan,
      reference,
      amount: expected,
      markProcessed,
    });
    if (!result.applied) {
      await client.query("ROLLBACK");
      return ok("already processed");
    }

    await client.query("COMMIT");
    email = user.email;
    finalPlan = result.finalPlan;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    throw err;
  } finally {
    client.release();
  }

  sendSellerWelcomeEmail(PLAN_LABELS[parsed.plan], email, finalPlan).catch((err) =>
    console.error("Seller welcome email failed:", err.message),
  );
  return ok("subscription activated");
}

// ─────────────────────────────────────────────────────────────────────────
// Tournament entry
// ─────────────────────────────────────────────────────────────────────────
async function handleTournamentPayment(parsed, reference, amount) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const isNew = await markProcessed(client, "charge.success.tournament", reference);
    if (!isNew) {
      await client.query("ROLLBACK");
      return ok("already processed");
    }

    const userRes = await client.query(`SELECT id, username, email FROM users WHERE id = $1`, [
      parsed.userId,
    ]);
    const user = userRes.rows[0];
    if (!user) {
      await client.query("ROLLBACK");
      alertAdmin("Tournament payment for unknown user", { reference, amount });
      return ok("unknown user, flagged");
    }

    const tRes = await client.query(
      `SELECT id, slots_left, entry_fee FROM tournaments WHERE id = $1 FOR UPDATE`,
      [parsed.tournamentId],
    );
    const tournament = tRes.rows[0];
    const fee = tournament
      ? parseInt(String(tournament.entry_fee).replace(/[^0-9]/g, ""), 10) || 0
      : 0;

    const dup = tournament
      ? await client.query(
          `SELECT 1 FROM tournament_contestants WHERE tournament_id = $1 AND user_id = $2`,
          [parsed.tournamentId, parsed.userId],
        )
      : { rows: [] };

    const cannotRegister =
      !tournament ||
      tournament.slots_left <= 0 ||
      dup.rows.length > 0 ||
      fee <= 0 ||
      amount + 0.001 < fee;

    if (cannotRegister) {
      // Paid, but registration is impossible (full, duplicate, bad amount):
      // return the money to the wallet rather than keeping it.
      await creditWalletRefund(
        client,
        parsed.userId,
        amount,
        reference,
        "Refund: tournament registration could not be completed",
      );
      await client.query("COMMIT");
      alertAdmin("Tournament payment refunded to wallet", {
        reference,
        tournamentId: parsed.tournamentId,
        amount,
      });
      return ok("refunded to wallet");
    }

    await client.query(
      `INSERT INTO tournament_contestants
         (tournament_id, user_id, player_name, email, payment_ref, payment_status)
       VALUES ($1, $2, $3, $4, $5, 'confirmed')`,
      [parsed.tournamentId, parsed.userId, user.username, user.email, reference],
    );
    await client.query(
      `UPDATE tournaments SET slots_left = slots_left - 1 WHERE id = $1`,
      [parsed.tournamentId],
    );
    await client.query(
      `INSERT INTO users_transactions
         (user_id, type, amount, status, description, reference, affects_balance)
       VALUES ($1, 'debit', $2, 'success', 'Tournament registration', $3, false)`,
      [parsed.userId, amount, reference],
    );

    await client.query("COMMIT");
    return ok("tournament registration confirmed");
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    throw err;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Verified FAILED charge
// ─────────────────────────────────────────────────────────────────────────
async function handleFailedCharge(parsed, reference) {
  if (parsed.purpose !== "marketplace") {
    return ok(`${parsed.purpose} charge failed, nothing to roll back`);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const txRes = await client.query(`SELECT * FROM transactions WHERE id = $1 FOR UPDATE`, [
      parsed.transactionId,
    ]);
    const tx = txRes.rows[0];

    // Only an order that is still waiting on THIS payment may be failed.
    if (
      !tx ||
      tx.payment_reference !== reference ||
      tx.payment_status !== "pending" ||
      tx.transaction_status !== "initiated"
    ) {
      await client.query("ROLLBACK");
      return ok("no action needed");
    }

    await client.query(
      `UPDATE transactions
          SET payment_status = 'failed', transaction_status = 'cancelled', updated_at = NOW()
        WHERE id = $1`,
      [tx.id],
    );
    // Release the listing only if it is still reserved for THIS buyer.
    await client.query(
      `UPDATE listings SET status = 'active', processing_by = NULL
        WHERE id = $1 AND status = 'processing' AND processing_by = $2`,
      [tx.listing_id, tx.buyer_id],
    );
    await client.query("COMMIT");
    return ok("marketplace payment failed, listing restored");
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    throw err;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Unprompted bank transfer into a customer's dedicated virtual account
// ─────────────────────────────────────────────────────────────────────────
async function handleVirtualAccountCharge(data, reference) {
  if (!reference || !data?.id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (String(data.status || "").toLowerCase() !== "successful") {
    return ok("not successful, ignored");
  }

  // The webhook body is not enough — confirm the credit with Flutterwave.
  const verification = await verifyById(data.id);
  if (verification.status === "error") {
    return NextResponse.json({ error: "Could not verify payment" }, { status: 503 });
  }
  if (verification.status === "notfound") {
    console.error("Virtual account charge not found at Flutterwave:", reference);
    return ok("not found, ignored");
  }
  const verified = verification.data;
  if (
    String(verified.status || "").toLowerCase() !== "successful" ||
    String(verified.currency || "").toUpperCase() !== "NGN" ||
    verified.tx_ref !== reference
  ) {
    return ok("verification mismatch, ignored");
  }

  const customerEmail = verified?.customer?.email;
  const amount = Number(verified?.amount || 0);
  if (!customerEmail || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const isNew = await markProcessed(client, "charge.success.dva", reference);
    if (!isNew) {
      await client.query("ROLLBACK");
      return ok("already processed");
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
        [reference, customerEmail, amount, JSON.stringify(verified)],
      );
      await client.query("COMMIT");
      alertAdmin("Unrecognised virtual account credit — needs manual reconciliation", {
        reference,
        customerEmail,
        amount,
      });
      return ok("unrecognised account, flagged");
    }

    await client.query(
      `INSERT INTO users_transactions
         (user_id, type, amount, status, description, reference, affects_balance)
       VALUES ($1, 'credit', $2, 'success', 'Bank transfer funding', $3, true)`,
      [virtualAccount.user_id, amount, reference],
    );

    await client.query("COMMIT");
    return ok("virtual account wallet credited");
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error("Virtual account webhook error:", err.message, { reference, amount });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
