import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // REMOVE the pool.query to get userId — use user.id directly
  const banksRes = await pool.query(
    `SELECT account_number, account_name, bank_code, bank_name
     FROM user_banks WHERE user_id = $1 ORDER BY created_at DESC LIMIT 3`,
    [user.id]
  );
  return NextResponse.json({ banks: banksRes.rows });
}