import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await requireUser(); // null if guest — that's fine
    const { sessionId } = await req.json();
    // Try to resume existing session
    if (sessionId) {
      const existing = await pool.query(
        "SELECT * FROM chat_sessions WHERE id = $1 AND deleted_at IS NULL",
        [sessionId]
      );
      if (existing.rows[0]) {
        return NextResponse.json({ session: existing.rows[0] });
      }
    }

 

    const result = await pool.query(
      `INSERT INTO chat_sessions (user_id, mode, status, created_at)
       VALUES ($1, 'bot', 'open', NOW())
       RETURNING *`,
      [user?.id ?? null]
    );

    return NextResponse.json({ session: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("POST /api/chat/session error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}