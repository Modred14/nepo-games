import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import pool from "@/lib/db";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
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

    // Create new session — works for guests too
    const userId = session?.user?.email
      ? (await pool.query("SELECT id FROM users WHERE email = $1", [session.user.email])).rows[0]?.id
      : null;

    const result = await pool.query(
      `INSERT INTO chat_sessions (user_id, mode, status, created_at)
       VALUES ($1, 'bot', 'open', NOW())
       RETURNING *`,
      [userId]
    );

    return NextResponse.json({ session: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("POST /api/chat/session error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}