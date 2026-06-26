import { NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { sendSellerWelcomeEmail } from "@/lib/emails/sendSellerWelcome";

export async function POST(req) {
  console.log("🔥 PAYSTACK WEBHOOK HIT");

  const rawBody = await req.text();

  try {
    const signature = req.headers.get("x-paystack-signature");

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      console.error("❌ Invalid Paystack signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (err) {
      console.error("❌ Invalid JSON from Paystack:", err);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const data = event.data;
    const reference = data?.reference;

    // ─────────────────────────────────────────────
    // charge.success
    // ─────────────────────────────────────────────
    if (event?.event === "charge.success") {
      const metadata = data?.metadata || {};
      const userId = data?.metadata?.userId;
      const purpose = metadata?.purpose;
      const amount = data.amount / 100;
      const sellerAmount = amount;

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

        // FIX #3: Wrap all marketplace steps in a single DB transaction
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

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

          // Idempotency check — prevent duplicate webhook processing
          if (transaction.payment_status === "paid") {
            await client.query("ROLLBACK");
            console.log("⚠️ Already processed:", transactionId);
            return NextResponse.json({ status: "already processed" });
          }

          // Update transaction
          await client.query(
            `UPDATE transactions
             SET
               payment_status = 'paid',
               transaction_status = 'pending',
               escrow_status = 'holding',
               payment_provider_response = $1,
               updated_at = NOW()
             WHERE id = $2`,
            // FIX #10: Stringify the object so it's stored as valid JSON, not "[object Object]"
            [JSON.stringify(data), transactionId],
          );

          await client.query(
            `UPDATE listings SET status = 'pending' WHERE id = $1`,
            [listingId],
          );

          // Buyer ledger: credit (Paystack deposit) then debit (purchase)
          await client.query(
            `INSERT INTO users_transactions
             (user_id, type, amount, status, description, reference)
             VALUES ($1, 'credit', $2, 'success', 'Wallet funding', $3)`,
            [transaction.buyer_id, amount, reference],
          );
          await client.query(
            `INSERT INTO users_transactions
             (user_id, type, amount, status, description, reference)
             VALUES ($1, 'debit', $2, 'success', 'Game account purchase', $3)`,
            [transaction.buyer_id, amount, reference],
          );

          // Seller ledger: credit 95% held in escrow
          await client.query(
            `INSERT INTO users_transactions
             (user_id, type, amount, status, description, reference)
             VALUES ($1, 'credit', $2, 'pending', 'Game account purchase', $3)`,
            [transaction.seller_id, sellerAmount, reference],
          );

          // Platform fee
          const platformFee = amount * 0.05;
          await client.query(
            `INSERT INTO users_transactions
             (user_id, type, amount, status, description, reference)
             VALUES ($1, 'debit', $2, 'pending', 'Listing fee', $3)`,
            [transaction.seller_id, platformFee, reference],
          );
          await client.query(
            `INSERT INTO users_transactions
             (user_id, type, amount, status, description, reference)
             VALUES ($1, 'credit', $2, 'pending', 'Platform fee', $3)`,
            [1, platformFee, reference],
          );

          // FIX #4: Guard system message — only insert if a conversation exists
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
          } else {
            console.warn(
              "⚠️ No conversation found for listing, skipping system message:",
              listingId,
            );
          }

          await client.query("COMMIT");
          console.log("✅ Marketplace payment processed:", transactionId);
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
        const existing = await pool.query(
          "SELECT id FROM users_transactions WHERE reference = $1",
          [reference],
        );
        if (existing.rows.length > 0) {
          console.log("⚠️ Duplicate webhook ignored:", reference);
          return NextResponse.json({ status: "already processed" });
        }

        await pool.query(
          `INSERT INTO users_transactions (user_id, type, amount, status, description, reference)
           VALUES ($1, 'credit', $2, 'success', 'Wallet funding', $3)`,
          [userId, amount, reference],
        );

        console.log("💰 Wallet funded:", amount);
        return NextResponse.json({ status: "wallet credited" });
      }

      // ── SUBSCRIPTION ─────────────────────────────
      if (purpose === "subscription") {
        // FIX #6: Duplicate webhook protection — check by reference before doing anything
        const existing = await pool.query(
          "SELECT id FROM payments WHERE reference = $1",
          [reference],
        );
        if (existing.rows.length > 0) {
          console.log("⚠️ Duplicate subscription webhook ignored:", reference);
          return NextResponse.json({ status: "already processed" });
        }

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

        const { plan, days, label } = planData;

        await pool.query(
          `INSERT INTO payments (user_id, amount, reference, status)
           VALUES ($1, $2, $3, $4)`,
          [userId, data.amount, reference, "success"],
        );
        await pool.query(
          `INSERT INTO users_transactions (user_id, type, amount, status, description, reference)
           VALUES ($1, 'credit', $2, 'success', 'Subscription payment', $3)`,
          [userId, amount, reference],
        );
        await pool.query(
          `INSERT INTO users_transactions (user_id, type, amount, status, description, reference)
           VALUES ($1, 'debit', $2, 'success', 'Subscription payment', $3)`,
          [userId, amount, reference],
        );
        await pool.query(
          `UPDATE users
           SET
             plan = $1,
             subscription_status = 'active',
             subscription_start = NOW(),
             subscription_end =
               CASE
                 WHEN subscription_end > NOW()
                 THEN subscription_end + ($2 * interval '1 day')
                 ELSE NOW() + ($2 * interval '1 day')
               END,
             paystack_reference = $3
           WHERE id = $4`,
          [plan, days, reference, userId],
        );

        sendSellerWelcomeEmail(label, user.email, plan)
          .then(() => console.log("📧 Email sent"))
          .catch((err) => console.error("❌ Email failed:", err));

        return NextResponse.json({ status: "subscription activated" });
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

        const existing = await pool.query(
          `SELECT id FROM tournament_contestants WHERE tournament_id = $1 AND user_id = $2`,
          [tournament_id, userId],
        );
        if (existing.rows.length > 0) {
          console.log(
            "⚠️ Tournament already registered:",
            userId,
            tournament_id,
          );
          return NextResponse.json({ status: "already processed" });
        }

        const client = await pool.connect();
        try {
          await client.query("BEGIN");

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

          await client.query(
            `INSERT INTO users_transactions
             (user_id, type, amount, status, description, reference)
             VALUES ($1, 'credit', $2, 'success', 'Tournament registration', $3)`,
            [userId, amount, reference],
          );
          await client.query(
            `INSERT INTO users_transactions
             (user_id, type, amount, status, description, reference)
             VALUES ($1, 'debit', $2, 'success', 'Tournament registration', $3)`,
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
    // transfer.success
    // ─────────────────────────────────────────────
    if (event.event === "transfer.success") {
      // FIX #8: Old code checked for existence and skipped if found — but the
      // withdrawal row is CREATED when the withdrawal is initiated (as 'pending'),
      // so it always existed, meaning the UPDATE to 'success' never ran.
      // Fix: check if it's already 'success' specifically, not just if it exists.
      const existing = await pool.query(
        "SELECT id, status FROM users_transactions WHERE reference = $1",
        [reference],
      );

      if (existing.rows.length > 0 && existing.rows[0].status === "success") {
        console.log(
          "⚠️ Duplicate transfer.success webhook ignored:",
          reference,
        );
        return NextResponse.json({ status: "already processed" });
      }

      await pool.query(
        `UPDATE users_transactions SET status = 'success' WHERE reference = $1`,
        [reference],
      );

      return NextResponse.json({ status: "withdrawal success updated" });
    }

    // ─────────────────────────────────────────────
    // charge.failed
    // ─────────────────────────────────────────────
    if (event?.event === "charge.failed") {
      const metadata = data?.metadata || {};
      const purpose = metadata?.purpose;
      const userId = metadata?.userId;
      const amount = data.amount / 100;

      if (purpose === "marketplace") {
        const transactionId = metadata.transaction_id;
        const listingId = metadata.listing_id;

        if (!transactionId || !listingId) {
          console.error("❌ Missing transaction metadata on failed charge");
          return NextResponse.json(
            { error: "Missing metadata" },
            { status: 400 },
          );
        }

        const txRes = await pool.query(
          `SELECT * FROM transactions WHERE id = $1`,
          [transactionId],
        );
        const transaction = txRes.rows[0];

        if (!transaction) {
          console.error(
            "❌ Transaction not found on failed charge:",
            transactionId,
          );
          return NextResponse.json(
            { error: "Transaction not found" },
            { status: 404 },
          );
        }

        // FIX #9: Re-enable the already-paid guard that was commented out.
        // If charge.success already ran, do NOT restore the listing or cancel
        // the transaction — the buyer paid and delivery is in progress.
        if (transaction.payment_status === "paid") {
          console.log(
            "⚠️ charge.failed received but transaction already paid, ignoring:",
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
          // FIX #10: Stringify here too
          [JSON.stringify(data), transactionId],
        );

        console.log(
          "❌ Marketplace payment failed, listing restored:",
          listingId,
        );
        return NextResponse.json({
          status: "marketplace payment failed, listing restored",
        });
      }

      if (purpose === "wallet") {
        console.log(
          "❌ Wallet funding failed for user:",
          userId,
          "amount:",
          amount,
        );
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
    // transfer.failed
    // ─────────────────────────────────────────────
    if (event.event === "transfer.failed") {
      await pool.query(
        `UPDATE users_transactions SET status = 'failed' WHERE reference = $1`,
        [reference],
      );
      return NextResponse.json({ status: "withdrawal failed updated" });
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
