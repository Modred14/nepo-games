// ROUTE: src/app/api/chat/history/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { authorizeChatSession } from "@/lib/chatSession";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const access = await authorizeChatSession(req, searchParams.get("sessionId"), { allowDeleted: true });
    if (!access.ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = await pool.query(
      `SELECT id, role, text, created_at
         FROM chat_messages
        WHERE session_id = $1
        ORDER BY created_at ASC
        LIMIT 500`,
      [access.session.id],
    );
    return NextResponse.json({ messages: result.rows });
  } catch (err) {
    console.error("GET /api/chat/history error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
