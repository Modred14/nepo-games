import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    const user = await requireUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      console.error("❌ Missing conversationId");
      return Response.json(
        { error: "Missing conversationId" },
        { status: 400 }
      );
    }

    // 🔒 SECURITY: ensure user is part of this conversation
    const convoCheck = await pool.query(
      `
      SELECT * FROM conversations
      WHERE id = $1 AND (	sender_id = $2 OR receiver_id = $2)
      `,
      [conversationId, user.id]
    );

    if (convoCheck.rows.length === 0) {
      return Response.json(
        { error: "Unauthorized access to conversation" },
        { status: 403 }
      );
    }

    // ✅ Fetch login deliveries
    const result = await pool.query(
      `
      SELECT *
      FROM login_deliveries
      WHERE conversation_id = $1
      ORDER BY created_at DESC
      `,
      [conversationId]
    );

    return Response.json({
      success: true,
      data: result.rows,
    });

  } catch (err) {
    console.error("GET LOGIN DETAILS ERROR:", err);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}