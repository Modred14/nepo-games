// File: src/app/api/paystack/transfer-approval/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// ─────────────────────────────────────────────
// Paystack Transfer Approval URL
// ─────────────────────────────────────────────
// This is NOT a webhook you receive after a transfer completes — it's a
// synchronous check Paystack makes DURING transfer initiation, in place of
// the OTP prompt. Once you disable "Confirm transfers before sending" (OTP)
// on the dashboard and register this URL under Settings → Preferences →
// Transfer Approval, every transfer request we create in
// src/app/api/user/withdraw/route.js gets checked here instead of pausing
// for a human to type a code.
//
// Paystack sends the same payload it received on our transfer request
// (reference, amount in kobo, recipient, source, etc). We must respond
// within a few seconds:
//   - 200 -> transfer proceeds
//   - 400 -> transfer is rejected
//   - no response in time -> Paystack marks it "blocked"
//
// We treat our own `users_transactions` pending-debit row (created right
// before we call /transfer in withdraw/route.js) as the source of truth:
// the reference must exist, belong to a debit, still be pending, and its
// naira amount must match what Paystack is about to send — in kobo — to
// the recipient. Anything else is rejected outright, which is what actually
// closes the "leaked secret key" risk that OTP used to cover.
export async function POST(req) {
  try {
    const body = await req.json();
    const { reference, amount } = body || {};

    if (!reference || amount === undefined || amount === null) {
      console.error("❌ Transfer approval: missing reference/amount", body);
      return NextResponse.json({ error: "Missing reference or amount" }, {
        status: 400,
      });
    }

    // Paystack sends amount in kobo, same unit we sent it in.
    const expectedKobo = Math.round(Number(amount));

    const txRes = await pool.query(
      `SELECT amount, type, status
       FROM users_transactions
       WHERE reference = $1`,
      [reference],
    );

    const tx = txRes.rows[0];

    if (!tx) {
      console.error("🚨 Transfer approval: unknown reference, rejecting", reference);
      return NextResponse.json({ error: "Unknown transfer reference" }, {
        status: 400,
      });
    }

    if (tx.type !== "debit" || tx.status !== "pending") {
      console.error(
        "🚨 Transfer approval: reference not a pending withdrawal, rejecting",
        reference,
        tx.type,
        tx.status,
      );
      return NextResponse.json(
        { error: "Transfer does not match a pending withdrawal" },
        { status: 400 },
      );
    }

    const ourKobo = Math.round(Number(tx.amount) * 100);

    if (ourKobo !== expectedKobo) {
      console.error(
        "🚨 Transfer approval: amount mismatch, rejecting",
        reference,
        "ours(kobo):",
        ourKobo,
        "paystack(kobo):",
        expectedKobo,
      );
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    console.log("✅ Transfer approved:", reference, expectedKobo);
    return NextResponse.json({ status: "approved" });
  } catch (err) {
    console.error("🔥 Transfer approval crash:", err);
    // Fail closed — never approve a transfer we couldn't validate.
    return NextResponse.json({ error: "Internal server error" }, {
      status: 400,
    });
  }
}