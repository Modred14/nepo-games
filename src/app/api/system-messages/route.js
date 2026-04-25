import pool from "../../../lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

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
