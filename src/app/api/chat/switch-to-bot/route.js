// app/api/chat/switch-to-bot/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await requireUser();
    if (!user || user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { sessionId } = await req.json();
    if (!sessionId)
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    await pool.query(
      `UPDATE chat_sessions SET mode = 'bot', agent_id = NULL, updated_at = NOW() WHERE id = $1`,
      [sessionId]
    );

    await pool.query(
      `INSERT INTO chat_messages (session_id, role, text, created_at)
       VALUES ($1, 'system', 'You have been switched back to the AI assistant.', NOW())`,
      [sessionId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/chat/switch-to-bot error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}