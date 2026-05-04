import pool from "../../../../lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req) {
  try {
    const { user_id, message_id } = await req.json();

    if (!message_id) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userid = user.id;
    if (!userid) {
      return Response.json({ error: "Missing user_id" }, { status: 400 });
    }

    await pool.query(
      `
      INSERT INTO system_message_reads (user_id, message_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [userid, message_id],
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
