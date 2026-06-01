import pool from "../../../../../lib/db";
import { requireUser } from "../../../../../lib/auth";
import { getCached, invalidateCache } from "../../../../../lib/cache";

/**
 * POST /api/chat/send
 *
 * BEFORE: Every send did a conversation lookup + insert = 2 DB queries
 * AFTER:  Conversation read from cache (put there by GET) = 1 DB query (just the insert)
 *         Then cache is busted so GET fetches fresh messages
 */
export async function POST(req) {
  try {
    const user = await requireUser(); // ✅ Zero DB — reads from JWT
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user_id = user.id;
    const body = await req.json();
    const { text, gameId, receiverId } = body;

    if (!user_id || !text || !gameId) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. GET CONVERSATION — from cache first, DB only if cache miss
    // ─────────────────────────────────────────────────────────────────────────
    const convoKey = `convo:${gameId}:${Math.min(user_id, receiverId)}:${Math.max(user_id, receiverId)}`;
    let conversation = await getCached(convoKey);

    if (!conversation) {
      const convo = await pool.query(
        `SELECT * FROM conversations
         WHERE listing_id = $1
         AND (
           (sender_id = $2 AND receiver_id = $3)
           OR
           (sender_id = $3 AND receiver_id = $2)
         )
         LIMIT 1`,
        [gameId, user_id, receiverId],
      );

      if (convo.rows.length === 0) {
        return Response.json(
          { error: "Not allowed to send message here" },
          { status: 403 },
        );
      }

      conversation = convo.rows[0];
      // Re-cache it for future sends
      const { setCached } = await import("../../../../../lib/cache");
      await setCached(convoKey, conversation, 60 * 60);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. INSERT MESSAGE — always hits DB (required for persistence)
    // ─────────────────────────────────────────────────────────────────────────
    const message = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [conversation.id, user_id, text],
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 3. BUST the message cache so the next GET fetches fresh messages
    // ─────────────────────────────────────────────────────────────────────────
    await invalidateCache(`messages:${conversation.id}`);

    return Response.json(
      { success: true, message: message.rows[0], conversation },
      { status: 201 },
    );
  } catch (err) {
    console.error("🔥 SEND MESSAGE ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
