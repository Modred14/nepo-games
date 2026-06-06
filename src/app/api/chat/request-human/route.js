// app/api/chat/request-human/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req) {
  const { sessionId } = await req.json();
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  await pool.query(
    `UPDATE chat_sessions SET mode = 'pending', updated_at = NOW() WHERE id = $1`,
    [sessionId]
  );
  await pool.query(
    `INSERT INTO chat_messages (session_id, role, text, created_at)
     VALUES ($1, 'system', 'User has requested a human agent.', NOW())`,
    [sessionId]
  );
  return NextResponse.json({ success: true });
}