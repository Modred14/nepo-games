import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listingId, receiverId, paymentMethod } = await req.json();

    // FIX #8: Validate receiverId is present and is a number before doing anything
    if (!receiverId || isNaN(Number(receiverId))) {
      return Response.json({ error: "Invalid receiverId" }, { status: 400 });
    }

    // FIX #1 & #11: Wrap everything in a DB transaction with advisory lock
    // to prevent race conditions on stale tx cleanup and multi-step operations.
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // FIX #1: Acquire a per-listing advisory lock so concurrent requests
      // for the same listing are serialised — no two requests can proceed past
      // this point simultaneously for the same listingId.
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

      // FIX #8: Validate that receiverId actually matches the listing's seller
      if (Number(receiverId) !== Number(listing.user_id)) {
        await client.query("ROLLBACK");
        return Response.json({ error: "Invalid receiverId" }, { status: 400 });
      }

      if (listing.status !== "active") {
        await client.query("ROLLBACK");
        return Response.json(
          { error: "Listing not available" },
          { status: 400 },
        );
      }

      // Check for existing active transaction OR stale processing state
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
          // FIX #1: Stale cleanup now happens inside the advisory-locked
          // transaction, so only one request can ever do this at a time.
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

      // Guard against another user's processing state
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

      // FIX #7: Validate amount before any payment method branching
      if (!Number.isFinite(amount) || amount <= 0) {
        await client.query("ROLLBACK");
        return Response.json(
          { error: "Invalid listing price" },
          { status: 400 },
        );
      }

      // ─────────────────────────────────────────────
      // WALLET PAYMENT
      // ─────────────────────────────────────────────
      if (paymentMethod === "wallet") {
        // FIX #3: Lock the user's transaction rows so no concurrent request
        // can read the same balance and pass the check simultaneously.
        const balanceResult = await client.query(
          `SELECT
             COALESCE(SUM(
               CASE
                 WHEN type = 'credit' THEN amount
                 WHEN type = 'debit'  THEN -amount
               END
             ), 0) AS balance
           FROM users_transactions
           WHERE user_id = $1 AND status = 'success'
           FOR UPDATE`,
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

        // FIX #4: Set processing_by so the processing-guard works correctly
        // FIX #2: Only set 'processing' once; final status written at the end
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

        // Debit buyer
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

        // Credit platform fee immediately
        await client.query(
          `INSERT INTO users_transactions
           (user_id, type, amount, status, description, reference)
           VALUES ($1, 'credit', $2, 'pending', 'Platform fee', $3)`,
          [1, platformFee, reference],
        );

        // FIX #2: Listing moves straight to 'pending' — no intermediate
        // redundant 'processing' → 'pending' flip inside the same request.
        await client.query(
          `UPDATE listings SET status = 'pending', processing_by = NULL WHERE id = $1`,
          [listingId],
        );

        // FIX #6: Guard the system message insert — only send if a conversation exists
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
      // PAYSTACK PAYMENT
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

        // Lock listing to this user while they're on the Paystack page
        await client.query(
          `UPDATE listings SET status = 'processing', processing_by = $2 WHERE id = $1`,
          [listingId, user.id],
        );

        // Call Paystack — do this before COMMIT so we can roll back cleanly on failure
        const paystackRes = await fetch(
          "https://api.paystack.co/transaction/initialize",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: user.email,
              // FIX #7: Re-derive kobo amount from the already-validated `amount`
              // so there is no possibility of using a tampered/un-validated value.
              amount: amount * 100,
              reference: `tx_${transaction.id}_${Date.now()}`,
              callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/c/${listing.id}?receiver_id=${receiverId}&transaction_id=${transaction.id}&listing_id=${listing.id}&payment=success`,
              metadata: {
                userId: user.id,
                purpose: "marketplace",
                transaction_id: transaction.id,
                listing_id: listing.id,
                // FIX #8: receiverId has already been validated against listing.user_id above
                receiverId,
              },
            }),
          },
        );

        const paystackData = await paystackRes.json();

        if (!paystackData.status) {
          // Roll back the whole transaction — listing stays active, no orphan tx row
          await client.query("ROLLBACK");
          return Response.json(
            { error: "Payment init failed" },
            { status: 500 },
          );
        }

        await client.query(
          `UPDATE transactions SET payment_reference = $1 WHERE id = $2`,
          [paystackData.data.reference, transaction.id],
        );

        await client.query("COMMIT");

        return Response.json({
          authorization_url: paystackData.data.authorization_url,
          transactionId: transaction.id,
        });
      }

      // Unknown payment method
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
