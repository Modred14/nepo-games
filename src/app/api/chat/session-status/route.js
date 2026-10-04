// ROUTE: src/app/api/chat/session-status/route.js
import { NextResponse } from "next/server";
import { authorizeChatSession } from "@/lib/chatSession";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const access = await authorizeChatSession(req, searchParams.get("sessionId"));
  if (!access.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ mode: access.session.mode ?? "bot" });
}
