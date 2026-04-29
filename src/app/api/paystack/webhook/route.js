import { NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";

export async function POST(req) {
  const rawBody = await req.text();

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");

  const signature = req.headers.get("x-paystack-signature");

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    const data = event.data;

    const userId = data.metadata.userId;
    const plan = data.metadata.plan;
    const reference = data.reference;

    // prevent duplicate processing
    const existing = await pool.query(
      `SELECT * FROM payments WHERE reference = $1`,
      [reference]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({ status: "already processed" });
    }

    // save payment
    await pool.query(
      `INSERT INTO payments (user_id, amount, reference, status)
       VALUES ($1,$2,$3,$4)`,
      [userId, data.amount, reference, "success"]
    );

    // determine duration
    let duration = "30 days";
    if (plan === "plus") duration = "90 days";
    if (plan === "premium") duration = "365 days";

    // update user
    await pool.query(
      `UPDATE users
       SET 
         plan = $1,
         subscription_status = 'active',
         subscription_start = NOW(),
         subscription_end = 
           CASE 
             WHEN subscription_end > NOW() 
             THEN subscription_end + INTERVAL '${duration}'
             ELSE NOW() + INTERVAL '${duration}'
           END,
         paystack_reference = $2
       WHERE id = $3`,
      [plan, reference, userId]
    );
  }

  return NextResponse.json({ status: "ok" });
}