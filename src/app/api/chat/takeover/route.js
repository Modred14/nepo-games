import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await requireUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { sessionId, agentMessage } = await req.json();
    if (!sessionId)
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 },
      );

    await pool.query(
      `UPDATE chat_sessions SET mode = 'human', agent_id = $1, updated_at = NOW() WHERE id = $2`,
      [user.id, sessionId], // user.id from JWT
    );

    // Save agent message if provided
    if (agentMessage?.trim()) {
      await pool.query(
        `INSERT INTO chat_messages (session_id, role, text, created_at)
         VALUES ($1, 'assistant', $2, NOW())`,
        [sessionId, agentMessage],
      );
    }

    return NextResponse.json({ success: true, mode: "human" });
  } catch (err) {
    console.error("POST /api/chat/takeover error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
