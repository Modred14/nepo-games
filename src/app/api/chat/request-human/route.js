// ROUTE: src/app/api/chat/request-human/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { authorizeChatSession } from "@/lib/chatSession";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rateLimit";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const access = await authorizeChatSession(req, body?.sessionId);
  if (!access.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rl = await checkRateLimit(`chat-human:${getClientIp(req)}`, { limit: 5, windowSeconds: 600 });
  if (!rl.allowed) return tooManyRequests();

  // Only a bot-mode session can be escalated; don't reset an agent's session.
  if (access.session.mode === "pending" || access.session.mode === "human") {
    return NextResponse.json({ success: true });
  }

  await pool.query(
    `UPDATE chat_sessions SET mode = 'pending', updated_at = NOW() WHERE id = $1`,
    [access.session.id],
  );
  await pool.query(
    `INSERT INTO chat_messages (session_id, role, text, created_at)
     VALUES ($1, 'system', 'User has requested a human agent.', NOW())`,
    [access.session.id],
  );
  return NextResponse.json({ success: true });
}
