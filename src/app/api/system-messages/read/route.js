import pool from "../../../../lib/db";

export async function POST(req) {
  try {
    const { user_id, message_id } = await req.json();

    if (!user_id || !message_id) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    await pool.query(
      `
      INSERT INTO system_message_reads (user_id, message_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [user_id, message_id],
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
