import pool from "../../../../../../lib/db";

export async function GET(req, context) {
  try {
    const params = await context.params;
    const listing_id = params.slug;

    const { searchParams } = new URL(req.url);
    const sender_id = searchParams.get("user_id");
    const receiver_id = searchParams.get("receiver_id"); // REQUIRED for chat model

    if (!sender_id || !receiver_id || !listing_id) {
      return Response.json(
        { error: "Missing params (sender_id, receiver_id, listing_id)" },
        { status: 400 }
      );
    }

    // -----------------------------
    // 1. GET OR CREATE CONVERSATION
    // -----------------------------
    let convo = await pool.query(
      `SELECT * FROM conversations
       WHERE sender_id = $1
       AND receiver_id = $2
       AND listing_id = $3
       LIMIT 1`,
      [sender_id, receiver_id, listing_id]
    );

    // If not found, create it
    if (convo.rows.length === 0) {
      try {
        convo = await pool.query(
          `INSERT INTO conversations (sender_id, receiver_id, listing_id)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [sender_id, receiver_id, listing_id]
        );
      } catch (err) {
        // race condition fallback
        convo = await pool.query(
          `SELECT * FROM conversations
           WHERE sender_id = $1
           AND receiver_id = $2
           AND listing_id = $3
           LIMIT 1`,
          [sender_id, receiver_id, listing_id]
        );
      }
    }

    const conversation = convo.rows[0];

    if (!conversation) {
      return Response.json(
        { error: "Failed to create/fetch conversation" },
        { status: 500 }
      );
    }

    // -----------------------------
    // 2. GET MESSAGES
    // -----------------------------
    const messages = await pool.query(
      `SELECT *
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversation.id]
    );

    // -----------------------------
    // 3. RESPONSE
    // -----------------------------
    return Response.json({
      conversation,
      messages: messages.rows,
    });
  } catch (err) {
    console.error("[CHAT API CRASH]", err);

    return Response.json(
      {
        error: "Server error",
        details: err.message,
      },
      { status: 500 }
    );
  }
}