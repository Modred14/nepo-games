// ROUTE: src/app/api/paystack/buy/initialize/route.js
//
// Starts a purchase. SECURITY (audit hardening):
//  - Price, seller, fee and listing state are all read from the database
//    inside a row-locked transaction; the client only names the listing.
//  - listingId / receiverId / paymentMethod are validated.
//  - Wallet purchases lock the BUYER'S USER ROW before reading the balance so
//    two parallel purchases (or a purchase racing a withdrawal) cannot both
//    spend the same naira.
//  - A card checkout reserves the listing, but a reservation now EXPIRES
//    (STALE_CHECKOUT_MINUTES) and a user can hold only a few at once, so an
//    attacker cannot lock the whole marketplace by starting checkouts and
//    never paying.
//  - The raw payment-provider response is no longer logged.
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { emitToRoom } from "@/lib/socket";
import { getSetting } from "@/lib/settings";
import { checkRateLimit, tooManyRequests } from "@/lib/rateLimit";

const STALE_CHECKOUT_MINUTES = 60; // unpaid card checkouts older than this release the listing
const MAX_OPEN_CHECKOUTS_PER_USER = 3;

export async function POST(req) {
  try {
    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ADMIN DASHBOARD (general settings): block new purchases during
    // maintenance. Deliberately does NOT touch already-in-progress
    // escrow/delivery flows (confirm, senddetails, cron release) — an
    // admin flipping this on mid-transaction shouldn't strand a buyer
    // who's already paid; it only stops NEW checkouts from starting.
    const maintenanceMode = await getSetting("maintenance_mode");
    if (maintenanceMode) {
      return Response.json(
        { error: "Purchases are temporarily unavailable — the marketplace is under maintenance." },
        { status: 503 },
      );
    }

    const rl = await checkRateLimit(`buy-init:${user.id}`, { limit: 10, windowSeconds: 60 });
    if (!rl.allowed) return tooManyRequests();

    const body = await req.json().catch(() => ({}));
    const { paymentMethod } = body;
    const listingId = Number(body.listingId);
    const receiverId = Number(body.receiverId);

    if (!Number.isInteger(listingId) || listingId <= 0) {
      return Response.json({ error: "Invalid listingId" }, { status: 400 });
    }
    if (!Number.isInteger(receiverId) || receiverId <= 0) {
      return Response.json({ error: "Invalid receiverId" }, { status: 400 });
    }
    if (paymentMethod !== "wallet" && paymentMethod !== "paystack") {
      return Response.json({ error: "Invalid payment method" }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query("SELECT pg_advisory_xact_lock($1)", [listingId]);

      const listingRes = await client.query(
        "SELECT * FROM listings WHERE id = $1 FOR UPDATE",
        [listingId],
      );

      const listing = listingRes.rows[0];

      if (!listing) {
        await client.query("ROLLBACK");
        return Response.json({ error: "Listing not found" }, { status: 404 });
      }

      if (Number(receiverId) !== Number(listing.user_id)) {
        await client.query("ROLLBACK");
        return Response.json({ error: "Invalid receiverId" }, { status: 400 });
      }

      if (Number(listing.user_id) === Number(user.id)) {
        await client.query("ROLLBACK");
        return Response.json(
          { error: "You cannot buy your own listing" },
          { status: 400 },
        );
      }

      // ADMIN DASHBOARD PHASE 4: a listing an admin has hidden, rejected,
      // or soft-deleted must not be purchasable even if its `status`
      // still happens to read 'active' — moderation_status/deleted_at
      // are independent of the checkout-flow status field (see
      // db/migrations/007_listing_moderation.sql for why they're kept
      // separate rather than overloading `status`).
      if (
        listing.status !== "active" ||
        listing.moderation_status !== "approved" ||
        listing.deleted_at
      ) {
        await client.query("ROLLBACK");
        return Response.json(
          { error: "Listing not available" },
          { status: 400 },
        );
      }

      // This buyer's own unfinished attempts on this listing.
      const existing = await client.query(
        `SELECT * FROM transactions
          WHERE listing_id = $1
            AND buyer_id = $2
            AND payment_status IN ('pending', 'paid')
          FOR UPDATE`,
        [listingId, user.id],
      );

      if (existing.rows.length > 0) {
        const stale = existing.rows.find(
          (tx) => tx.transaction_status === "initiated",
        );

        if (stale && existing.rows.length === 1) {
          // Abandoned checkout by the same buyer: supersede it. If its card
          // payment completes late, the webhook refunds it to the wallet
          // (it never resurrects a cancelled order).
          await client.query(
            `UPDATE transactions
                SET transaction_status = 'cancelled', payment_status = 'failed', updated_at = NOW()
              WHERE id = $1`,
            [stale.id],
          );
          await client.query(
            `UPDATE listings SET status = 'active', processing_by = NULL
              WHERE id = $1 AND status = 'processing' AND processing_by = $2`,
            [listingId, user.id],
          );
          listing.status = "active";
          listing.processing_by = null;
        } else {
          await client.query("ROLLBACK");
          return Response.json(
            { error: "Transaction already exists" },
            { status: 400 },
          );
        }
      }

      // Someone else is mid-checkout on this listing. Their reservation only
      // holds for STALE_CHECKOUT_MINUTES; after that it is released so a
      // buyer who walked away cannot block the listing forever.
      if (
        listing.status === "processing" &&
        Number(listing.processing_by) !== Number(user.id)
      ) {
        const holder = await client.query(
          `SELECT id FROM transactions
            WHERE listing_id = $1
              AND buyer_id = $2
              AND payment_status = 'pending'
              AND transaction_status = 'initiated'
              AND created_at < NOW() - ($3 || ' minutes')::interval
            FOR UPDATE`,
          [listingId, listing.processing_by, String(STALE_CHECKOUT_MINUTES)],
        );
        if (holder.rows.length === 0) {
          await client.query("ROLLBACK");
          return Response.json({ error: "Listing not available" }, { status: 400 });
        }
        await client.query(
          `UPDATE transactions
              SET transaction_status = 'cancelled', payment_status = 'failed', updated_at = NOW()
            WHERE id = ANY($1::bigint[])`,
          [holder.rows.map((r) => r.id)],
        );
        await client.query(
          `UPDATE listings SET status = 'active', processing_by = NULL WHERE id = $1`,
          [listingId],
        );
        listing.status = "active";
        listing.processing_by = null;
      }

      // Limit how many listings one account can reserve at once.
      if (paymentMethod === "paystack") {
        const open = await client.query(
          `SELECT COUNT(*)::int AS n FROM transactions
            WHERE buyer_id = $1
              AND payment_status = 'pending'
              AND transaction_status = 'initiated'`,
          [user.id],
        );
        if (open.rows[0].n >= MAX_OPEN_CHECKOUTS_PER_USER) {
          await client.query("ROLLBACK");
          return Response.json(
            { error: "You have too many unfinished checkouts. Complete or cancel one first." },
            { status: 429 },
          );
        }
      }

      const amount = Number(listing.price);
      const sellerFeePercent = await getSetting("seller_fee_percent");
      const platformFee = Math.round(amount * Number(sellerFeePercent)) / 100;
      const sellerAmount = amount;

      if (!Number.isFinite(amount) || amount <= 0) {
        await client.query("ROLLBACK");
        return Response.json(
          { error: "Invalid listing price" },
          { status: 400 },
        );
      }

      // ─────────────────────────────────────────────
      // WALLET PAYMENT — unchanged, no external provider involved
      // ─────────────────────────────────────────────
      // FIX: all rows inserted below now explicitly set affects_balance =
      // true. This whole branch only runs when paymentMethod === "wallet",
      // so every row here IS real money moving in/out of someone's wallet
      // (unlike the card/Flutterwave webhook flow, where the buyer's
      // "Game account purchase" debit is history-only and must be marked
      // affects_balance = false — see paystack/webhook/route.js and the
      // balance queries in user/account, user/withdraw, and this file).
      if (paymentMethod === "wallet") {
        // Serialise ALL wallet-affecting operations for this user (withdraw
        // locks the same row). Locking only the ledger rows does not stop a
        // concurrent transaction from INSERTING a new debit, which previously
        // allowed a double-spend.
        await client.query(`SELECT id FROM users WHERE id = $1 FOR UPDATE`, [user.id]);

        // NOTE: `FOR UPDATE` cannot be combined with an aggregate (SUM) in
        // the same SELECT — Postgres errors with "FOR UPDATE is not allowed
        // with aggregate functions" because it can't determine which row(s)
        // to lock once they're collapsed into one aggregate value. Fix:
        // lock the raw rows first in a subquery, then aggregate the
        // already-locked rows in the outer query.
        const balanceResult = await client.query(
          `SELECT
             COALESCE(SUM(
               CASE
                 WHEN type = 'credit' THEN amount
                 WHEN type = 'debit'  THEN -amount
               END
             ), 0) AS balance
           FROM (
             SELECT amount, type
             FROM users_transactions
             WHERE user_id = $1 AND status = 'success' AND affects_balance = true
             FOR UPDATE
           ) locked_rows`,
          [user.id],
        );

        const balance = Number(balanceResult.rows[0].balance);

        if (balance < amount) {
          await client.query("ROLLBACK");
          return Response.json(
            { error: "Insufficient balance" },
            { status: 400 },
          );
        }

        await client.query(
          `UPDATE listings SET status = 'processing', processing_by = $2 WHERE id = $1`,
          [listingId, user.id],
        );

        const txRes = await client.query(
          `INSERT INTO transactions
           (buyer_id, seller_id, listing_id, amount, payment_method, payment_status, transaction_status, escrow_status, created_at)
           VALUES ($1, $2, $3, $4, 'wallet', 'paid', 'completed', 'holding', NOW())
           RETURNING *`,
          [user.id, listing.user_id, listing.id, amount],
        );

        const reference = `wallet_tx_${Date.now()}_${user.id}`;
        const transaction = txRes.rows[0];

        await client.query(
          `UPDATE transactions SET payment_reference = $1 WHERE id = $2`,
          [reference, transaction.id],
        );

        await client.query(
          `INSERT INTO users_transactions
           (user_id, type, amount, status, description, reference, affects_balance)
           VALUES ($1, 'debit', $2, 'success', 'Game account purchase', $3, true)`,
          [user.id, amount, reference],
        );

        await client.query(
          `INSERT INTO users_transactions
           (user_id, type, amount, status, description, reference, affects_balance)
           VALUES ($1, 'credit', $2, 'pending', 'Game account sale', $3, true)`,
          [listing.user_id, sellerAmount, reference],
        );
        await client.query(
          `INSERT INTO users_transactions
           (user_id, type, amount, status, description, reference, affects_balance)
           VALUES ($1, 'debit', $2, 'pending', 'Listing fee', $3, true)`,
          [listing.user_id, platformFee, reference],
        );

        await client.query(
          `INSERT INTO users_transactions
           (user_id, type, amount, status, description, reference, affects_balance)
           VALUES ($1, 'credit', $2, 'pending', 'Platform fee', $3, true)`,
          [1, platformFee, reference],
        );

        await client.query(
          `UPDATE listings SET status = 'pending', processing_by = NULL WHERE id = $1`,
          [listingId],
        );

        const convRes = await client.query(
          `SELECT id FROM conversations
            WHERE listing_id = $1
              AND ((sender_id = $2 AND receiver_id = $3) OR (sender_id = $3 AND receiver_id = $2))
            LIMIT 1`,
          [listingId, user.id, listing.user_id],
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
        }

        await client.query("COMMIT");

        // FIX: this message was being inserted but never broadcast, so the
        // seller only ever saw "Buyer has made payment..." after a manual
        // refresh instead of live in the chat like every other message
        // (senddetails/confirm/dispute all emit — this was the one gap).
        if (paymentMsg) {
          await emitToRoom(
            `room:${convRes.rows[0].id}`,
            "new_message",
            paymentMsg,
          );
        }
        await emitToRoom(`user:${user.id}`, "sidebar_update", {});
        await emitToRoom(`user:${listing.user_id}`, "sidebar_update", {});

        return Response.json({ success: true });
      }

      // ─────────────────────────────────────────────
      // CARD/BANK CHECKOUT PAYMENT (was "PAYSTACK PAYMENT", now Flutterwave)
      // ─────────────────────────────────────────────
      if (paymentMethod === "paystack") {
        const txRes = await client.query(
          `INSERT INTO transactions
           (buyer_id, seller_id, listing_id, amount, payment_method, payment_status, transaction_status, escrow_status, created_at)
           VALUES ($1, $2, $3, $4, 'paystack', 'pending', 'initiated', 'holding', NOW())
           RETURNING *`,
          [user.id, listing.user_id, listing.id, amount],
        );

        const transaction = txRes.rows[0];

        // Lock listing to this user while they're on the checkout page
        await client.query(
          `UPDATE listings SET status = 'processing', processing_by = $2 WHERE id = $1`,
          [listingId, user.id],
        );

        const tx_ref = `tx_${transaction.id}_${Date.now()}`;

        // Call Flutterwave — do this before COMMIT so we can roll back cleanly on failure
        const flwRes = await fetch("https://api.flutterwave.com/v3/payments", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tx_ref,
            // Flutterwave amount is in naira (major unit), not kobo.
            amount,
            currency: "NGN",
            redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/c/${listing.id}?receiver_id=${receiverId}&transaction_id=${transaction.id}&listing_id=${listing.id}&payment=success`,
            customer: {
              email: user.email,
            },
            meta: {
              userId: user.id,
              purpose: "marketplace",
              transaction_id: transaction.id,
              listing_id: listing.id,
              receiverId,
            },
          }),
          signal: AbortSignal.timeout(15000),
        });

        const flwData = await flwRes.json().catch(() => ({}));

        if (flwData.status !== "success") {
          await client.query("ROLLBACK");
          return Response.json(
            { error: "Payment init failed" },
            { status: 500 },
          );
        }

        // Guard: Flutterwave can report status "success" at the top level
        // while data.link is missing or malformed (e.g. missing the
        // "/flwlnk-..." suffix, causing the checkout host to 404 with
        // "Cannot GET /"). Catch that here instead of handing the frontend
        // a broken redirect URL.
        const paymentLink = flwData?.data?.link;
        if (!paymentLink || !/^https:\/\/[^/]+\/v3\/hosted\/pay\/.+/.test(paymentLink)) {
          console.error("Flutterwave returned success but no usable payment link");
          await client.query("ROLLBACK");
          return Response.json(
            { error: "Payment init failed" },
            { status: 500 },
          );
        }

        await client.query(
          `UPDATE transactions SET payment_reference = $1 WHERE id = $2`,
          [tx_ref, transaction.id],
        );

        await client.query("COMMIT");

        return Response.json({
          authorization_url: paymentLink,
          transactionId: transaction.id,
        });
      }

      await client.query("ROLLBACK");
      return Response.json(
        { error: "Invalid payment method" },
        { status: 400 },
      );
    } catch (innerErr) {
      await client.query("ROLLBACK");
      throw innerErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}