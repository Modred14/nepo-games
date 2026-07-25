// ORIGINAL ROUTE: src/app/api/user/withdraw/route.js
// CHANGED: Paystack transferrecipient + /transfer -> Flutterwave /v3/transfers
//
// SIMPLIFICATION: Flutterwave's /v3/transfers takes account_bank +
// account_number + amount directly on every call — there's no separate
// "create a transfer recipient first, then reuse its code" step like
// Paystack's transferrecipient object. So the recipient_code caching logic
// from the original file is removed entirely; we just pass the bank details
// straight through each time. The `users.recipient_code` column is left
// alone (unused now) rather than dropped, to avoid a migration.
//
// Also see the note in src/app/api/paystack/transfer-approval/route.js —
// the synchronous OTP-bypass approval step Paystack had is not a Flutterwave
// concept. This route's own pre-transfer validation (PIN check, balance
// check, pending-row-created-before-calling-the-provider) is what actually
// carries that safety property forward, and is unchanged below.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req) {
  const client = await pool.connect();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { accountNumber, bankCode, accountName, pin } = body;

    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (amount < 100) {
      return NextResponse.json(
        { error: "Minimum withdrawal is ₦100.00" },
        { status: 400 },
      );
    }

    if (!pin || !/^\d{4}$/.test(String(pin))) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 400 });
    }

    await client.query("BEGIN");

    const userRes = await client.query(
      `
      SELECT id, plan, email, pin_hash, pin_attempts, pin_locked_until
      FROM users
      WHERE email = $1
      FOR UPDATE
      `,
      [session.user.email],
    );

    const user = userRes.rows[0];

    if (!user) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user.id;

    if (user.pin_locked_until && new Date(user.pin_locked_until) > new Date()) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Too many incorrect PIN attempts. Try again later." },
        { status: 429 },
      );
    }

    if (!user.pin_hash) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "No withdrawal PIN set. Please set a PIN first." },
        { status: 400 },
      );
    }

    const isValid = await bcrypt.compare(String(pin), user.pin_hash);

    if (!isValid) {
      const attempts = (user.pin_attempts || 0) + 1;

      if (attempts >= 5) {
        await client.query(
          `UPDATE users
           SET pin_attempts = $1,
               pin_locked_until = NOW() + INTERVAL '15 minutes'
           WHERE id = $2`,
          [attempts, userId],
        );
        await client.query("COMMIT");
        return NextResponse.json(
          { error: "Too many failed attempts. Locked for 15 minutes." },
          { status: 429 },
        );
      }

      await client.query(
        `UPDATE users SET pin_attempts = $1 WHERE id = $2`,
        [attempts, userId],
      );
      await client.query("COMMIT");
      return NextResponse.json({ error: "Incorrect PIN" }, { status: 403 });
    }

    await client.query(
      `UPDATE users SET pin_attempts = 0, pin_locked_until = NULL WHERE id = $1`,
      [userId],
    );

    const balanceRes = await client.query(
      `
      SELECT COALESCE(SUM(
        CASE 
          WHEN type = 'credit' AND status = 'success' THEN amount
          WHEN type = 'debit' AND status IN ('success', 'pending') THEN -amount
          ELSE 0
        END
      ), 0) AS balance
      FROM users_transactions
      WHERE user_id = $1
      `,
      [userId],
    );

    const balance = Number(balanceRes.rows[0].balance || 0);

    if (amount > balance) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 },
      );
    }

    // 3. Create reference
    const reference = `WD_${Date.now()}_${userId}`;

    const banksRes = await fetch("https://api.flutterwave.com/v3/banks/NG", {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      },
    });

    const banksData = await banksRes.json();

    if (!banksRes.ok || banksData.status !== "success") {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Unable to fetch bank list" },
        { status: 400 },
      );
    }
    const bankName =
      banksData.data.find((b) => b.code === bankCode)?.name || "Unknown Bank";

    if (!accountName) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Account name not resolved yet" },
        { status: 400 },
      );
    }

    await client.query(
      `
      INSERT INTO user_banks 
      (user_id, account_number, account_name, bank_code, bank_name, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (user_id, account_number, bank_code)
      DO UPDATE SET 
        account_name = EXCLUDED.account_name,
        bank_name = EXCLUDED.bank_name,
        created_at = NOW()
      `,
      [userId, accountNumber, accountName, bankCode, bankName],
    );

    // 4. Insert pending transaction FIRST
    await client.query(
      `
      INSERT INTO users_transactions
      (user_id, type, amount, status, description, reference)
      VALUES ($1, 'debit', $2, 'pending', 'Withdrawal', $3)
      `,
      [userId, amount, reference],
    );

    await client.query("COMMIT");

    // 5. CALL FLUTTERWAVE (outside DB transaction)
    try {
      const flwRes = await fetch("https://api.flutterwave.com/v3/transfers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_bank: bankCode,
          account_number: accountNumber,
          // Flutterwave amount is in naira, not kobo.
          amount,
          currency: "NGN",
          narration: "Wallet withdrawal",
          reference,
        }),
      });

      const flwData = await flwRes.json();

      if (!flwRes.ok || flwData.status !== "success") {
        await pool.query(
          `UPDATE users_transactions SET status = 'failed' WHERE reference = $1`,
          [reference],
        );

        return NextResponse.json(
          { error: flwData.message || "Transfer failed" },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Withdrawal initiated",
        reference,
      });
    } catch (transferErr) {
      console.error("Flutterwave transfer call failed:", transferErr);
      await pool.query(
        `UPDATE users_transactions SET status = 'failed' WHERE reference = $1`,
        [reference],
      );
      return NextResponse.json(
        { error: "Transfer failed, please try again" },
        { status: 500 },
      );
    }
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      // transaction may already be closed (e.g. committed earlier) — ignore
    }
    console.error("Withdraw error:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
