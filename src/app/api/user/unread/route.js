import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user_id = user.id;

    const result = await pool.query(
      `
      SELECT COUNT(*) AS unread_count
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      LEFT JOIN conversation_reads cr 
        ON cr.conversation_id = c.id 
        AND cr.user_id = $1
      WHERE 
        (c.sender_id = $1 OR c.receiver_id = $1)
        AND m.sender_id != $1
        AND (
          cr.last_read_at IS NULL
          OR m.created_at > cr.last_read_at
        )
      `,
      [user_id]
    );

    return Response.json({
      unread: parseInt(result.rows[0].unread_count, 10),
    });
  } catch (err) {
    console.error("UNREAD ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}