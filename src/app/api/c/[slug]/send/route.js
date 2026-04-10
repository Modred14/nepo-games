import pool from "../../../../../../lib/db";
import crypto from "crypto";

export async function POST(req) {
  try {
    const body = await req.json();
    const { user_id, text, gameId, receiverId } = body;

    if (!user_id || !text || !gameId) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. FIND OR CREATE CONVERSATION
    let convo = await pool.query(
      `   SELECT * FROM conversations
      WHERE listing_id = $1
      AND (
        (sender_id = $2 AND receiver_id = $3)
        OR
        (sender_id = $3 AND receiver_id = $2)
      )
      LIMIT 1
      `,
      [gameId, user_id, receiverId]
    );

    if (convo.rows.length === 0) {
      try {  convo = await pool.query(
        `INSERT INTO conversations (sender_id, listing_id, receiver_id)
   VALUES ($1, $2, $3)
   RETURNING *`,
        [user_id, gameId, receiverId],
      );
    }catch (err) {
        // fallback (race condition)
        convo = await pool.query(
          `
          SELECT * FROM conversations
          WHERE listing_id = $1
          AND (
            (sender_id = $2 AND receiver_id = $3)
            OR
            (sender_id = $3 AND receiver_id = $2)
          )
          LIMIT 1
          `,
          [gameId, user_id, receiverId]
        );
      }
    }

    const conversation = convo.rows[0];

    // 2. INSERT MESSAGE
    const message = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, message)
   VALUES ($1, $2, $3)
   RETURNING *`,
      [
        conversation.id,
        user_id,
        text, // your frontend text goes here
      ],
    );

    return Response.json(
      {
        success: true,
        message: message.rows[0],
        conversation,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("🔥 SEND MESSAGE ERROR:", err);

    return new Response(
      JSON.stringify({
        error: err.message,
        stack: err.stack,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
