import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import pool from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRes = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [session.user.email]
  );

  const userId = userRes.rows[0]?.id;

  const banksRes = await pool.query(
    `
    SELECT account_number, account_name, bank_code, bank_name
    FROM user_banks
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 3
    `,
    [userId]
  );

  return NextResponse.json({ banks: banksRes.rows });
}