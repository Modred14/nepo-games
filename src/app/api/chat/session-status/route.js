// app/api/chat/session-status/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const { rows } = await pool.query(
    `SELECT mode FROM chat_sessions WHERE id = $1`, [sessionId]
  );
  return NextResponse.json({ mode: rows[0]?.mode ?? "bot" });
}