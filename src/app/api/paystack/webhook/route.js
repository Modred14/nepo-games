import { NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { sendSellerWelcomeEmail } from "@/lib/emails/sendSellerWelcome";

export async function POST(req) {
  console.log("🔥 PAYSTACK WEBHOOK HIT");
  const rawBody = await req.text();

  try {
    // =========================
    // VERIFY SIGNATURE
    // =========================
    const signature = req.headers.get("x-paystack-signature");

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      console.error("❌ Invalid Paystack signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // =========================
    // PARSE EVENT SAFELY
    // =========================
    let event;

    try {
      event = JSON.parse(rawBody);
    } catch (err) {
      console.error("❌ Invalid JSON from Paystack:", err);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (event?.event !== "charge.success") {
      return NextResponse.json({ status: "ignored" });
    }

    const data = event.data;

    // =========================
    // SAFE METADATA ACCESS
    // =========================
    const userId = data?.metadata?.userId;
    const reference = data?.reference;

    if (!userId || !reference) {
      console.error("❌ Missing metadata:", data);
      return NextResponse.json(
        { error: "Missing metadata" },
        { status: 400 }
      );
    }

    // =========================
    // AMOUNT HANDLING
    // =========================
    const amount = Math.round(data.amount / 100);

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
        { status: 400 }
      );
    }

    const { plan, days, label } = planData;

    // =========================
    // CHECK USER
    // =========================
    const userRes = await pool.query(
      "SELECT id, email FROM users WHERE id = $1",
      [userId]
    );

    const user = userRes.rows[0];

    if (!user) {
      console.error("❌ User not found:", userId);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // =========================
    // IDENTITY PROTECTION (NO DUPLICATES)
    // =========================
    const existing = await pool.query(
      "SELECT id FROM payments WHERE reference = $1",
      [reference]
    );

    if (existing.rows.length > 0) {
      console.log("⚠️ Duplicate webhook ignored:", reference);
      return NextResponse.json({ status: "already processed" });
    }

    // =========================
    // SAVE PAYMENT
    // =========================
    await pool.query(
      `INSERT INTO payments (user_id, amount, reference, status)
       VALUES ($1,$2,$3,$4)`,
      [userId, data.amount, reference, "success"]
    );

    // =========================
    // UPDATE USER
    // =========================
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
      [plan, days, reference, userId]
    );

    // =========================
    // EMAIL (NON-BLOCKING)
    // =========================
    sendSellerWelcomeEmail(label, user.email, plan)
      .then(() => console.log("📧 Email sent"))
      .catch((err) => console.error("❌ Email failed:", err));

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("🔥 WEBHOOK CRASH:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}