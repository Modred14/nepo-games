// ROUTE: src/app/api/c/[slug]/messages/route.js
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
    const listing_id = Number(params.slug);
    const { searchParams } = new URL(req.url);

    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sender_id = Number(user.id);
    const receiver_id = Number(searchParams.get("receiver_id"));

    if (
      !Number.isInteger(sender_id) ||
      !Number.isInteger(receiver_id) ||
      receiver_id <= 0 ||
      !Number.isInteger(listing_id) ||
      listing_id <= 0 ||
      receiver_id === sender_id
    ) {
      return Response.json(
        { error: "Missing params (receiver_id, listing_id)" },
        { status: 400 },
      );
    }

    // SECURITY: a conversation about a listing is ONLY ever between the
    // listing's seller and one buyer. Previously any two ids could be
    // supplied, so a user could create conversations with arbitrary users
    // (harassment/phishing channel under a real listing) and the system
    // would then treat it as a legitimate trade chat. One side MUST be the
    // listing owner.
    const listingRes = await pool.query(
      `SELECT user_id FROM listings WHERE id = $1 AND deleted_at IS NULL`,
      [listing_id],
    );
    if (listingRes.rows.length === 0) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }
    const sellerId = Number(listingRes.rows[0].user_id);
    if (sender_id !== sellerId && receiver_id !== sellerId) {
      return Response.json({ error: "Not allowed" }, { status: 403 });
    }

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
        // Only a prospective BUYER may open the conversation (the seller
        // cannot cold-start chats with arbitrary users).
        if (sender_id === sellerId) {
          return Response.json({ error: "Not allowed" }, { status: 403 });
        }
        try {
          convo = await pool.query(
            `INSERT INTO conversations (sender_id, receiver_id, listing_id)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [sender_id, receiver_id, listing_id],
          );
        } catch {
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
        return Response.json({ error: "Failed to create/fetch conversation" }, { status: 500 });
      }

      conversation = convo.rows[0];
      await setCached(convoKey, conversation, 60 * 60);
    }

    // Final membership check (covers a stale/poisoned cache entry).
    if (
      Number(conversation.sender_id) !== sender_id &&
      Number(conversation.receiver_id) !== sender_id
    ) {
      return Response.json({ error: "Not allowed" }, { status: 403 });
    }

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
    console.error("CHAT GET ERROR:", err.message);
    return Response.json(
      { error: "Server error" },
      { status: 500 },
    );
  }
}
