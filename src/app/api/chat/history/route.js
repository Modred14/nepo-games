import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT id, role, text, created_at
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sessionId]
    );

    return NextResponse.json({ messages: result.rows });
  } catch (err) {
    console.error("GET /api/chat/history error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}