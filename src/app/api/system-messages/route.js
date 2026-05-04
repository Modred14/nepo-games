import pool from "../../../lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user_id = user.id;
    if (!user_id) {
      return Response.json({ error: "Missing user_id" }, { status: 400 });
    }

    const result = await pool.query(
      `
      SELECT 
        sm.id,
        sm.title,
        sm.message,
        sm.created_at,
        CASE 
          WHEN smr.user_id IS NULL THEN false
          ELSE true
        END AS is_read
      FROM system_messages sm
      LEFT JOIN system_message_reads smr
        ON smr.message_id = sm.id
        AND smr.user_id = $1
      ORDER BY sm.created_at DESC
      `,
      [user_id],
    );

    return Response.json(result.rows);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
