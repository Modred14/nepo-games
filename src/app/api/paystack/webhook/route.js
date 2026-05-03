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

    if (event?.event === "charge.success") {
      const metadata = data?.metadata || {};
      const userId = data?.metadata?.userId;
      const purpose = metadata?.purpose;
      const amount = data.amount / 100;

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

      const existing = await pool.query(
        "SELECT id FROM users_transactions WHERE reference = $1",
        [reference],
      );

      if (existing.rows.length > 0) {
        console.log("⚠️ Duplicate webhook ignored:", reference);
        return NextResponse.json({ status: "already processed" });
      }

      if (purpose === "marketplace") {
        const transactionId = metadata.transaction_id;
        const listingId = metadata.listing_id;

        if (!transactionId || !listingId) {
          console.error("❌ Missing transaction metadata");
          return NextResponse.json(
            { error: "Missing metadata" },
            { status: 400 },
          );
        }

        // 1. Get transaction
        const txRes = await pool.query(
          `SELECT * FROM transactions WHERE id = $1`,
          [transactionId],
        );

        const transaction = txRes.rows[0];

        if (!transaction) {
          console.error("❌ Transaction not found:", transactionId);
          return NextResponse.json(
            { error: "Transaction not found" },
            { status: 404 },
          );
        }

        // Prevent duplicate processing
        if (transaction.payment_status === "paid") {
          console.log("⚠️ Already processed:", transactionId);
          return NextResponse.json({ status: "already processed" });
        }

        // 2. Update transaction
        await pool.query(
          `UPDATE transactions
     SET 
       payment_status = 'paid',
       transaction_status = 'in_progress',
       escrow_status = 'holding',
       payment_provider_response = $1,
       updated_at = NOW()
     WHERE id = $2`,
          [data, transactionId],
        );

        // 3. Update listing → pending
        await pool.query(
          `UPDATE listings
     SET status = 'pending'
     WHERE id = $1`,
          [listingId],
        );

        // 4. Notify seller (chat system message)
        await pool.query(
          `INSERT INTO messages 
    (conversation_id, sender_id, message, type, created_at)
    VALUES (
      (SELECT id FROM conversations WHERE listing_id = $1 LIMIT 1),
      0,
      'Buyer has made payment. Please provide login details.',
      'payment_made',
      NOW()
    )`,
          [listingId],
        );

        // 5. Insert buyer transaction record
        await pool.query(
          `INSERT INTO users_transactions 
    (user_id, amount, status, description, type, reference)
    VALUES ($1, $2, 'success', 'Marketplace payment', 'debit', $3)`,
          [transaction.buyer_id, amount, reference],
        );

        console.log("✅ Marketplace payment processed:", transactionId);

        return NextResponse.json({ status: "marketplace payment processed" });
      }

      if (purpose === "wallet") {
        await pool.query(
          `
        INSERT INTO users_transactions (user_id, type, amount, status, description, reference)
        VALUES ($1, 'credit', $2, 'success', 'Wallet funding', $3)
        `,
          [userId, amount, reference],
        );

        console.log("💰 Wallet funded:", amount);

        return NextResponse.json({ status: "wallet credited" });
      }

      if (purpose === "subscription") {
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
       VALUES ($1,$2,$3,$4)`,
          [userId, data.amount, reference, "success"],
        );
        await pool.query(
          `
  INSERT INTO users_transactions (user_id, type, amount, status, description, reference)
  VALUES ($1, 'debit', $2, 'success', 'Subscription payment', $3)
  `,
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
    }
    if (event.event === "transfer.success") {
      await pool.query(
        `UPDATE users_transactions
         SET status = 'success'
         WHERE reference = $1`,
        [reference],
      );

      return NextResponse.json({ status: "withdrawal success updated" });
    }

    // =========================
    // 3. WITHDRAWAL FAILED
    // =========================
    if (event.event === "transfer.failed") {
      await pool.query(
        `UPDATE users_transactions
         SET status = 'failed'
         WHERE reference = $1`,
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
