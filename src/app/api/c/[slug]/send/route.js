// ROUTE: src/app/api/c/[slug]/send/route.js
//
// SECURITY (audit hardening): validates ids/length, rate-limits senders, and
// binds the message to a conversation the caller is actually part of. The
// cached conversation is re-checked for membership so a cache entry can never
// be used to post into someone else's conversation.
import pool from "../../../../../lib/db";
import { requireUser } from "../../../../../lib/auth";
import { getCached, setCached, invalidateCache } from "../../../../../lib/cache";
import { emitToRoom } from "../../../../../lib/socket";
import { checkRateLimit, tooManyRequests } from "../../../../../lib/rateLimit";

const MAX_MESSAGE_LENGTH = 2000;

export async function POST(req) {
  try {
    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(`chat-send:${user.id}`, { limit: 30, windowSeconds: 60 });
    if (!rl.allowed) return tooManyRequests("You're sending messages too quickly.");

    const restrictionRes = await pool.query(
      `SELECT messaging_restricted FROM users WHERE id = $1`,
      [user.id],
    );
    if (restrictionRes.rows[0]?.messaging_restricted) {
      return Response.json(
        { error: "Your ability to send messages has been restricted. Contact support if you believe this is a mistake." },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const gameId = Number(body.gameId);
    const receiverId = Number(body.receiverId);
    const user_id = Number(user.id);

    if (!text || !Number.isInteger(gameId) || gameId <= 0 || !Number.isInteger(receiverId) || receiverId <= 0) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }
    if (text.length > MAX_MESSAGE_LENGTH) {
      return Response.json({ error: "Message is too long" }, { status: 400 });
    }

    const convoKey = `convo:${gameId}:${Math.min(user_id, receiverId)}:${Math.max(user_id, receiverId)}`;
    let conversation = await getCached(convoKey);

    const isMember = (c) =>
      c && (Number(c.sender_id) === user_id || Number(c.receiver_id) === user_id);

    if (!isMember(conversation)) {
      const convo = await pool.query(
        `SELECT * FROM conversations
          WHERE listing_id = $1
            AND ((sender_id = $2 AND receiver_id = $3) OR (sender_id = $3 AND receiver_id = $2))
          LIMIT 1`,
        [gameId, user_id, receiverId],
      );
      if (convo.rows.length === 0) {
        return Response.json({ error: "Not allowed to send message here" }, { status: 403 });
      }
      conversation = convo.rows[0];
      await setCached(convoKey, conversation, 60 * 60);
    }

    // The type column defaults to a normal user message; clients can never
    // pick a type (e.g. impersonate the system's "payment_made"/"confirm").
    const message = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [conversation.id, user_id, text],
    );

    const newMessage = message.rows[0];
    await invalidateCache(`messages:${conversation.id}`);
    await invalidateCache(`conversations:${user_id}`);
    await invalidateCache(`conversations:${receiverId}`);

    await emitToRoom(`room:${conversation.id}`, "new_message", newMessage);
    await emitToRoom(`user:${user_id}`, "sidebar_update", {});
    await emitToRoom(`user:${receiverId}`, "sidebar_update", {});

    return Response.json({ success: true, message: newMessage, conversation }, { status: 201 });
  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err.message);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
