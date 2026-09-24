// ROUTE: src/app/api/admin/reports/[id]/route.js  (NEW)
//
// ADMIN DASHBOARD (chat moderation): report detail, with the reported
// user's recent conversations for context — this is the "investigate
// reported conversations" requirement. Only conversations the reported
// user is actually party to; not their whole account history.
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const reportRes = await pool.query(
      `
      SELECT
        r.*,
        reporter.email AS reporter_email,
        reported.email AS reported_user_email, reported.messaging_restricted,
        l.title AS listing_title
      FROM reports r
      JOIN users reporter ON reporter.id = r.reporter_id
      JOIN users reported ON reported.id = r.reported_user_id
      LEFT JOIN listings l ON l.id = r.listing_id
      WHERE r.id = $1
      `,
      [id],
    );
    const report = reportRes.rows[0];
    if (!report) {
      return Response.json({ error: "Report not found" }, { status: 404 });
    }

    const conversationsRes = await pool.query(
      `
      SELECT c.id, c.listing_id, l.title AS listing_title,
             other.email AS other_participant_email,
             (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) AS message_count,
             (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id) AS last_message_at
      FROM conversations c
      LEFT JOIN listings l ON l.id = c.listing_id
      JOIN users other ON other.id = CASE
        WHEN c.sender_id = $1 THEN c.receiver_id ELSE c.sender_id END
      WHERE c.sender_id = $1 OR c.receiver_id = $1
      ORDER BY last_message_at DESC NULLS LAST
      LIMIT 20
      `,
      [report.reported_user_id],
    );

    return Response.json({ report, conversations: conversationsRes.rows });
  } catch (err) {
    console.error("ADMIN REPORT DETAIL ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}