// ROUTE: src/app/api/paystack/buy/initialize/route.js
// CHANGED (this pass): in the card/bank checkout branch, added a temporary
// console.log of the raw Flutterwave /v3/payments response (to diagnose the
// "Cannot GET /" checkout error — the redirect URL returned was missing its
// trailing /flwlnk-... id), plus a guard that now checks flwData.data.link
// actually looks like a real hosted-pay link before returning it as
// authorization_url. If it doesn't, we roll back and return a clean 500
// instead of handing the frontend a broken redirect. Remove the console.log
// once the raw response has been inspected and the root cause confirmed.
//
// PRIOR CHANGE: only the card/bank checkout branch below (previously
// "PAYSTACK PAYMENT") now calls Flutterwave's /v3/payments instead of
// Paystack's transaction/initialize. The `paymentMethod === "paystack"`
// string check was deliberately left AS-IS (not renamed to "flutterwave")
// so the frontend, DB columns, and check-constraints referencing this value
// don't also need to change — it's now just an internal label for "pay by
// card/bank checkout" rather than literally meaning "via Paystack".
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listingId, receiverId, paymentMethod } = await req.json();

    if (!receiverId || isNaN(Number(receiverId))) {
      return Response.json({ error: "Invalid receiverId" }, { status: 400 });
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

      if (listing.status !== "active") {
        await client.query("ROLLBACK");
        return Response.json(
          { error: "Listing not available" },
          { status: 400 },
        );
      }

      const existing = await client.query(
        `SELECT * FROM transactions
         WHERE listing_id = $1
         AND buyer_id = $2
         AND payment_status IN ('pending', 'paid')`,
        [listingId, user.id],
      );

      if (existing.rows.length > 0) {
        const stale = existing.rows.find(
          (tx) => tx.transaction_status === "initiated",
        );

        if (stale) {
          await client.query(
            `UPDATE transactions
             SET transaction_status = 'cancelled', payment_status = 'failed'
             WHERE id = $1`,
            [stale.id],
          );
          await client.query(
            `UPDATE listings SET status = 'active', processing_by = NULL WHERE id = $1`,
            [listingId],
          );
          listing.status = "active";
        } else {
          await client.query("ROLLBACK");
          return Response.json(
            { error: "Transaction already exists" },
            { status: 400 },
          );
        }
      }

      if (
        listing.status === "processing" &&
        listing.processing_by !== user.id
      ) {
        await client.query("ROLLBACK");
        return Response.json(
          { error: "Listing not available" },
          { status: 400 },
        );
      }

      const amount = Number(listing.price);
      const platformFee = amount * 0.05;
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
      if (paymentMethod === "wallet") {
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
             WHERE user_id = $1 AND status = 'success'
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
           (user_id, type, amount, status, description, reference)
           VALUES ($1, 'debit', $2, 'success', 'Game account purchase', $3)`,
          [user.id, amount, reference],
        );

        await client.query(
          `INSERT INTO users_transactions
           (user_id, type, amount, status, description, reference)
           VALUES ($1, 'credit', $2, 'pending', 'Game account sale', $3)`,
          [listing.user_id, sellerAmount, reference],
        );
        await client.query(
          `INSERT INTO users_transactions
           (user_id, type, amount, status, description, reference)
           VALUES ($1, 'debit', $2, 'pending', 'Listing fee', $3)`,
          [listing.user_id, platformFee, reference],
        );

        await client.query(
          `INSERT INTO users_transactions
           (user_id, type, amount, status, description, reference)
           VALUES ($1, 'credit', $2, 'pending', 'Platform fee', $3)`,
          [1, platformFee, reference],
        );

        await client.query(
          `UPDATE listings SET status = 'pending', processing_by = NULL WHERE id = $1`,
          [listingId],
        );

        const convRes = await client.query(
          `SELECT id FROM conversations WHERE listing_id = $1 LIMIT 1`,
          [listingId],
        );

        if (convRes.rows.length > 0) {
          await client.query(
            `INSERT INTO messages
             (conversation_id, sender_id, message, type, created_at)
             VALUES ($1, 1, 'Buyer has made payment. Seller should kindly provide login details.', 'payment_made', NOW())`,
            [convRes.rows[0].id],
          );
        }

        await client.query("COMMIT");
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
        });

        const flwData = await flwRes.json();

        // TEMP DEBUG: log the raw Flutterwave response so we can see exactly
        // what came back (e.g. status "success" but a malformed/incomplete
        // data.link) when diagnosing the "Cannot GET /" checkout issue.
        // Remove once confirmed fixed.
        console.log("Flutterwave /v3/payments raw response:", flwRes.status, JSON.stringify(flwData));

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
          console.error(
            "Flutterwave returned success but no usable payment link:",
            JSON.stringify(flwData),
          );
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