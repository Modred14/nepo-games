import pool from "../../../../../lib/db";
import { requireUser } from "../../../../../lib/auth";
import {
  getCached,
  setCached,
  invalidateCache,
} from "../../../../../lib/cache";

/**
 * GET /api/chat/[slug]?receiver_id=X
 *
 * BEFORE: DB hit on every open — fetches conversation + all messages every time
 * AFTER:  Redis/memory cache for messages — DB only on first load or after new message
 *
 * Cache strategy:
 *   - Key:  "messages:{conversation_id}"
 *   - TTL:  30 seconds (short enough to feel real-time, long enough to cut DB load 90%+)
 *   - Bust: Call invalidateCache(key) after every new message is saved (in POST route)
 */
export async function GET(req, context) {
  try {
    const params = await context.params;
    const listing_id = params.slug;
    const { searchParams } = new URL(req.url);

    const user = await requireUser(); // ✅ Zero DB — reads from JWT
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sender_id = user.id;
    const receiver_id = searchParams.get("receiver_id");

    if (!sender_id || !receiver_id || !listing_id) {
      return Response.json(
        { error: "Missing params (sender_id, receiver_id, listing_id)" },
        { status: 400 },
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. GET OR CREATE CONVERSATION
    //    Cache the conversation lookup — it almost never changes after creation
    // ─────────────────────────────────────────────────────────────────────────
    const convoKey = `convo:${listing_id}:${Math.min(sender_id, receiver_id)}:${Math.max(sender_id, receiver_id)}`;

    let conversation = await getCached(convoKey);

    if (!conversation) {
      let convo = await pool.query(
        `SELECT * FROM conversations
         WHERE listing_id = $1
         AND (
           (sender_id = $2 AND receiver_id = $3)
           OR
           (sender_id = $3 AND receiver_id = $2)
         )
         LIMIT 1`,
        [listing_id, sender_id, receiver_id],
      );

      if (convo.rows.length === 0) {
        try {
          convo = await pool.query(
            `INSERT INTO conversations (sender_id, receiver_id, listing_id)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [sender_id, receiver_id, listing_id],
          );
        } catch (err) {
          // Race condition fallback
          convo = await pool.query(
            `SELECT * FROM conversations
             WHERE listing_id = $1
             AND (
               (sender_id = $2 AND receiver_id = $3)
               OR
               (sender_id = $3 AND receiver_id = $2)
             )
             LIMIT 1`,
            [listing_id, sender_id, receiver_id],
          );
        }
      }

      if (!convo.rows[0]) {
        return Response.json(
          { error: "Failed to create/fetch conversation" },
          { status: 500 },
        );
      }

      conversation = convo.rows[0];
      // Cache for 1 hour — conversations basically never change
      await setCached(convoKey, conversation, 60 * 60);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. GET MESSAGES — cached for 30s
    //    The POST route calls invalidateCache(messagesKey) after each new message
    //    so the next GET after a send always gets fresh data
    // ─────────────────────────────────────────────────────────────────────────
    const messagesKey = `messages:${conversation.id}`;
    let messages = await getCached(messagesKey);

    if (!messages) {
      const result = await pool.query(
        `SELECT * FROM messages
         WHERE conversation_id = $1
         ORDER BY created_at ASC`,
        [conversation.id],
      );
      messages = result.rows;
      await setCached(messagesKey, messages, 30); // 30 second TTL
    }

    return Response.json({ conversation, messages });
  } catch (err) {
    console.error("🔥 CHAT GET ERROR:", err);
    return Response.json(
      { error: "Server error", details: err.message },
      { status: 500 },
    );
  }
}
