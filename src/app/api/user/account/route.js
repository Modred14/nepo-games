import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import pool from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 1. Get user
    const userResult = await pool.query(
      "SELECT id, plan FROM users WHERE email = $1",
      [session.user.email]
    );

    const user = userResult.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = user.id;

    // 2. Get transactions
    const txResult = await pool.query(
      `
      SELECT 
        id,
        type,
        amount,
        status,
        description,
        created_at
      FROM users_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    const transactions = txResult.rows;

    // 3. Compute balance (TRUTH SOURCE)
    // FIX (critical): this used to sum EVERY 'debit' row for the user,
    // including 'Game account purchase'/'Subscription payment'/'Tournament
    // registration' debit rows that get inserted purely as a HISTORY
    // record when someone pays by card/Flutterwave — money that was never
    // actually taken from their in-app wallet. That silently reduced
    // (sometimes negatively) a buyer's real, spendable balance any time
    // they paid by card instead of wallet. `affects_balance` (see
    // migration note in this route's git history / PR) is set false on
    // exactly those history-only rows at insert time, so only rows that
    // represent real money in/out of the wallet count here.
    const balanceResult = await pool.query(
      `
      SELECT 
        COALESCE(SUM(
          CASE 
            WHEN type = 'credit' AND status = 'success' THEN amount
            WHEN type = 'debit' AND status = 'success' THEN -amount
            ELSE 0
          END
        ), 0) AS balance
      FROM users_transactions
      WHERE user_id = $1
        AND affects_balance = true
      `,
      [userId]
    );

    const balance = balanceResult.rows[0].balance;

    return NextResponse.json({
      balance,
      transactions,
       plan: user.plan, 
    });
  } catch (err) {
    console.error("GET /api/user/account error:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}