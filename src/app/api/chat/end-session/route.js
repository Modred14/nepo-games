import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req) {
  const user = await requireUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { sessionId } = await req.json();

  // Insert a closing system message the user will see
  await pool.query(
    `INSERT INTO chat_messages (session_id, role, text, created_at)
     VALUES ($1, 'system', 'This conversation has been closed by support. Thank you!', NOW())`,
    [sessionId]
  );

  // Soft-close the session
  await pool.query(
    `UPDATE chat_sessions SET status = 'closed', deleted_at = NOW() WHERE id = $1`,
    [sessionId]
  );

  return NextResponse.json({ success: true });
}