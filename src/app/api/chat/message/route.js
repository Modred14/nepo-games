import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req) {
  try {
    const { sessionId, userMessage } = await req.json();

    if (!sessionId || !userMessage) {
      return NextResponse.json(
        { error: "sessionId and userMessage are required" },
        { status: 400 },
      );
    }

    // Verify session exists
    const sessionResult = await pool.query(
      "SELECT * FROM chat_sessions WHERE id = $1 AND deleted_at IS NULL",
      [sessionId],
    );
    const chatSession = sessionResult.rows[0];
    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    // After fetching chatSession, add:
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM chat_messages WHERE session_id = $1 AND role = 'user'`,
      [sessionId],
    );
    if (parseInt(countRes.rows[0].count) > 50) {
      return NextResponse.json(
        { error: "Message limit reached for this session" },
        { status: 429 },
      );
    }

    // Save user message
    await pool.query(
      `INSERT INTO chat_messages (session_id, role, text, created_at)
       VALUES ($1, 'user', $2, NOW())`,
      [sessionId, userMessage],
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
      [sessionId],
    );
    const allMessages = historyResult.rows.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    }));
    const messages = allMessages.reduce((acc, curr) => {
      const last = acc[acc.length - 1];
      if (last && last.role === curr.role) {
        // merge into previous
        last.parts[0].text += "\n" + curr.parts[0].text;
      } else {
        acc.push({ ...curr, parts: [{ text: curr.parts[0].text }] });
      }
      return acc;
    }, []);

    // Gemini also requires the conversation to START with a user message
    if (messages.length === 0 || messages[0].role !== "user") {
      return NextResponse.json(
        { error: "Invalid message history" },
        { status: 400 },
      );
    }

    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: `You are a support agent for Nepogames, a game trading marketplace.

IMPORTANT: Do NOT jump straight into giving solutions. Instead, follow this flow:

1. Greet the user warmly and ask them to pick a category:
   - 🔐 Account & Login Issues
   - 💳 Payments & Billing
   - ⚔️ Trade Dispute
   - 🛡️ Scam Report
   - ✅ Seller/Buyer Verification
   - 🐛 Technical Bug
   - ❓ Other

2. Once they pick a category, ask 1-2 short specific questions to understand their exact problem before giving any advice.

3. Only after understanding their issue, provide a clear and helpful response.

4. If the issue sounds serious (scam, unauthorized access, money lost), tell them a human agent will follow up and to stay calm.

5. Keep all responses short, warm, and easy to read. Use line breaks. Never write long paragraphs.

Never assume what the user's problem is. Always ask first.`,
              },
            ],
          },
          contents: messages,
        }),
      },
    );

    const aiData = await aiRes.json();
    const aiReply = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiReply) {
      return NextResponse.json(
        { error: "AI response failed" },
        { status: 500 },
      );
    }

    // Save AI reply
    await pool.query(
      `INSERT INTO chat_messages (session_id, role, text, created_at)
       VALUES ($1, 'assistant', $2, NOW())`,
      [sessionId, aiReply],
    );

    return NextResponse.json({ mode: "bot", reply: aiReply });
  } catch (err) {
    console.error("POST /api/chat/message error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
