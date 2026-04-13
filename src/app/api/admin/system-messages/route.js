import pool from "../../../../../lib/db";

export async function POST(req) {
  try {
    const { title, message } = await req.json();

    if (!message) {
      return Response.json({ error: "Message required" }, { status: 400 });
    }

    const result = await pool.query(
      `
      INSERT INTO system_messages (title, message)
      VALUES ($1, $2)
      RETURNING *
      `,
      [title, message]
    );

    return Response.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}