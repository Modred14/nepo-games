import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import pool from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentResult = await pool.query(
      "SELECT id, role FROM users WHERE email = $1",
      [session.user.email]
    );
    const agent = agentResult.rows[0];

    if (!agent || agent.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await pool.query(
      `SELECT 
        cs.id,
        cs.mode,
        cs.status,
        cs.created_at,
        u.username,
        u.email,
        (
          SELECT text FROM chat_messages
          WHERE session_id = cs.id
          ORDER BY created_at DESC LIMIT 1
        ) AS last_message,
        (
          SELECT COUNT(*) FROM chat_messages
          WHERE session_id = cs.id AND role = 'user'
        ) AS message_count
       FROM chat_sessions cs
       LEFT JOIN users u ON cs.user_id = u.id
       WHERE cs.status = 'open' AND cs.deleted_at IS NULL
       ORDER BY cs.created_at DESC`
    );

    return NextResponse.json({
      sessions: result.rows,
      total: result.rows.length,
    });
  } catch (err) {
    console.error("GET /api/chat/sessions error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}