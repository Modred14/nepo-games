import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req) {
  try {
    const { sessionId, userMessage } = await req.json();

    if (!sessionId || !userMessage) {
      return NextResponse.json({ error: "sessionId and userMessage are required" }, { status: 400 });
    }

    // Verify session exists
    const sessionResult = await pool.query(
      "SELECT * FROM chat_sessions WHERE id = $1 AND deleted_at IS NULL",
      [sessionId]
    );
    const chatSession = sessionResult.rows[0];
    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Save user message
    await pool.query(
      `INSERT INTO chat_messages (session_id, role, text, created_at)
       VALUES ($1, 'user', $2, NOW())`,
      [sessionId, userMessage]
    );

    // If human agent has taken over, don't auto-reply
    if (chatSession.mode === "human") {
      return NextResponse.json({ mode: "human", reply: null });
    }

    // Pull last 20 messages for context
    const historyResult = await pool.query(
      `SELECT role, text FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC
       LIMIT 20`,
      [sessionId]
    );

    const messages = historyResult.rows.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.text,
    }));

    // Call Claude
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: `You are a friendly support agent for Nepo Games, a game trading marketplace. 
                 Help users with account issues, trades, payments, and general questions. 
                 Be concise and warm. If the issue is complex or sensitive, let them know 
                 a human agent will follow up.`,
        messages,
      }),
    });

    const aiData = await aiRes.json();
    const aiReply = aiData.content?.[0]?.text;

    if (!aiReply) {
      return NextResponse.json({ error: "AI response failed" }, { status: 500 });
    }

    // Save AI reply
    await pool.query(
      `INSERT INTO chat_messages (session_id, role, text, created_at)
       VALUES ($1, 'assistant', $2, NOW())`,
      [sessionId, aiReply]
    );

    return NextResponse.json({ mode: "bot", reply: aiReply });
  } catch (err) {
    console.error("POST /api/chat/message error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}