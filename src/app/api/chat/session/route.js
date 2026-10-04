// ROUTE: src/app/api/chat/session/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { authorizeChatSession, chatCookieValue, chatCookieOptions, CHAT_COOKIE } from "@/lib/chatSession";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rateLimit";

export async function POST(req) {
  try {
    const user = await requireUser(); // null if guest — that's fine
    const body = await req.json().catch(() => ({}));

    // Resume an existing session ONLY if the caller owns it.
    if (body?.sessionId) {
      const access = await authorizeChatSession(req, body.sessionId);
      if (access.ok) {
        return NextResponse.json({ session: access.session });
      }
    }

    const rl = await checkRateLimit(`chat-new-session:${getClientIp(req)}`, { limit: 10, windowSeconds: 3600 });
    if (!rl.allowed) return tooManyRequests();

    const result = await pool.query(
      `INSERT INTO chat_sessions (user_id, mode, status, created_at)
       VALUES ($1, 'bot', 'open', NOW())
       RETURNING *`,
      [user?.id ?? null],
    );
    const session = result.rows[0];

    const res = NextResponse.json({ session }, { status: 201 });
    res.cookies.set(CHAT_COOKIE, chatCookieValue(session.id), chatCookieOptions());
    return res;
  } catch (err) {
    console.error("POST /api/chat/session error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
