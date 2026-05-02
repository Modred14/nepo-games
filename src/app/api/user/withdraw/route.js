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

    const { amount, accountNumber, bankCode, accountName, pin } =
      await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (amount < 100) {
      return NextResponse.json(
        { error: "Minimum withdrawal is ₦100.00" },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    // 1. Get user + lock row
    const userRes = await client.query(
      `
   SELECT id, plan, recipient_code, email, pin_hash
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

    //2. Plan restriction (FREE users only Tuesday)
    // const today = new Date().getDay();
    // if (user.plan === "free" && today !== 2) {
    //   await client.query("ROLLBACK");
    //   return NextResponse.json(
    //     { error: "Free users can only withdraw on Tuesdays" },
    //     { status: 403 },
    //   );
    // }

    // 3. Get balance

    const isValid = await bcrypt.compare(pin, user.pin_hash);

    if (!isValid) {
      return Response.json({ error: "Incorrect PIN" }, { status: 403 });
    }

    const balanceRes = await client.query(
      `
      SELECT COALESCE(SUM(
        CASE 
          WHEN type = 'credit' AND status = 'success' THEN amount
          WHEN type = 'debit' AND status = 'success' THEN -amount
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

    // 5. Create reference
    const reference = `WD_${Date.now()}_${userId}`;

    // BEFORE INSERT INTO user_banks
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

    await pool.query(
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

    // 6. Insert pending transaction FIRST
    await client.query(
      `
      INSERT INTO users_transactions
      (user_id, type, amount, status, description, reference)
      VALUES ($1, 'debit', $2, 'pending', 'Withdrawal', $3)
      `,
      [userId, amount, reference],
    );

    await client.query("COMMIT");

    // 7. CALL PAYSTACK (outside DB transaction)
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
      // rollback transaction status
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
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Withdraw error:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
