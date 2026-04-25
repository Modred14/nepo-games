import pool from "../../../../../lib/db";
import { requireUser } from "../../../../../lib/auth";

export async function POST(req) {
  try {
    const { gameId } = await req.json();
    const user = await requireUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user_id = user.id;

    if (!gameId) {
      console.log(gameId, user_id);
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    const convoRes = await pool.query(
      `
      SELECT id FROM conversations
      WHERE listing_id = $1
      AND (sender_id = $2 OR receiver_id = $2)
      LIMIT 1
      `,
      [gameId, user_id],
    );

    const conversation = convoRes.rows[0];

    if (!conversation) {
      return Response.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    await pool.query(
      `
      INSERT INTO conversation_reads (conversation_id, user_id, last_read_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (conversation_id, user_id)
      DO UPDATE SET last_read_at = NOW();
      `,
      [conversation.id, user_id],
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
