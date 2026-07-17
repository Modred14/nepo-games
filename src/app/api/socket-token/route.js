// src/app/api/socket-token/route.js
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { signSocketJoinToken } from "@/lib/socketAuth";

// FIX (critical, socket auth): issues a short-lived signed token that
// proves the current user is allowed to join a specific socket room —
// either their own personal notification room ("user:{id}"), or a specific
// conversation's room ("room:{conversationId}"), but ONLY after confirming
// in the DB that they're actually a participant of that conversation.
// Without this, joining a room was just "say any id, get put in that
// room" — see the note in server.js and Conversation.jsx for how this
// token gets used on connect.
export async function POST(req) {
  try {
    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { conversationId } = body;

    // No conversationId requested -> issue a token for the user's own
    // personal room only. Never trust a client-supplied user id here;
    // it's always the authenticated user's own id.
    if (!conversationId) {
      const room = `user:${user.id}`;
      const token = signSocketJoinToken({ userId: user.id, room });
      return Response.json({ room, token });
    }

    // Verify the requester is actually a participant of this conversation
    // before handing out a token that would let them join its room.
    const convo = await pool.query(
      `SELECT id FROM conversations
       WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)`,
      [conversationId, user.id],
    );

    if (convo.rows.length === 0) {
      return Response.json({ error: "Not allowed" }, { status: 403 });
    }

    const room = `room:${conversationId}`;
    const token = signSocketJoinToken({ userId: user.id, room });

    return Response.json({ room, token });
  } catch (err) {
    console.error("SOCKET TOKEN ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}