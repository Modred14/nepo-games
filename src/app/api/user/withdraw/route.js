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

    // FIX: coerce amount to a real number explicitly instead of relying on
    // loose JS comparisons, which let non-numeric strings slip past the
    // old `!amount` / `amount <= 0` checks via NaN comparison quirks.
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

    // 1. Get user + lock row
    const userRes = await client.query(
      `
      SELECT id, plan, recipient_code, email, pin_hash, pin_attempts, pin_locked_until
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

    // FIX: PIN attempt lockout, mirroring the logic already used in
    // /api/user/set-pin. Previously this endpoint let anyone with a valid
    // session brute-force the 4-digit withdrawal PIN with no rate limit.
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

    // Reset attempts on successful PIN match
    await client.query(
      `UPDATE users SET pin_attempts = 0, pin_locked_until = NULL WHERE id = $1`,
      [userId],
    );

    // 2. Get balance
    // FIX (the critical one): pending debits — i.e. withdrawals that have
    // been submitted but not yet confirmed by Paystack's transfer.success
    // webhook — were previously invisible to this calculation because it
    // only summed status = 'success' rows. That let someone submit several
    // withdrawal requests back-to-back, each one reading the same
    // not-yet-reduced balance before any single one had been confirmed,
    // withdrawing the same money multiple times over. Counting pending
    // debits as already-reserved closes that window: as soon as one
    // withdrawal's pending row commits, every subsequent balance check
    // (for this user) correctly sees the reduced, available amount.
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

    let recipientCode = user.recipient_code;

    if (!recipientCode) {
      const recipientRes = await fetch(
        "https://api.paystack.co/transferrecipient",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "nuban",
            name: user.email,
            account_number: accountNumber,
            bank_code: bankCode,
            currency: "NGN",
          }),
        },
      );

      const recipientData = await recipientRes.json();

      if (!recipientRes.ok) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: recipientData.message },
          { status: 400 },
        );
      }

      recipientCode = recipientData.data.recipient_code;

      await client.query("UPDATE users SET recipient_code = $1 WHERE id = $2", [
        recipientCode,
        userId,
      ]);
    }

    // 3. Create reference
    const reference = `WD_${Date.now()}_${userId}`;

    const banksRes = await fetch(
      "https://api.paystack.co/bank?country=nigeria",
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    const banksData = await banksRes.json();

    if (!banksRes.ok) {
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

    // 5. CALL PAYSTACK (outside DB transaction)
    // FIX: this whole block is now wrapped so that ANY failure here
    // (network error, bad JSON, thrown exception) explicitly marks the
    // transaction as 'failed' instead of leaving it stuck as 'pending'
    // forever. Previously, an exception thrown after COMMIT would hit the
    // outer catch block, which tried to ROLLBACK a transaction that had
    // already been committed — a no-op — leaving the withdrawal row
    // orphaned in 'pending' status indefinitely.
    try {
      const paystackRes = await fetch("https://api.paystack.co/transfer", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "balance",
          amount: amount * 100,
          recipient: recipientCode,
          reason: "Wallet withdrawal",
          reference,
        }),
      });

      const paystackData = await paystackRes.json();

      if (!paystackRes.ok) {
        await pool.query(
          `UPDATE users_transactions SET status = 'failed' WHERE reference = $1`,
          [reference],
        );

        return NextResponse.json(
          { error: paystackData.message || "Transfer failed" },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Withdrawal initiated",
        reference,
      });
    } catch (transferErr) {
      console.error("Paystack transfer call failed:", transferErr);
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