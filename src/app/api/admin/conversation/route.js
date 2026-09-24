// ROUTE: src/app/api/admin/conversations/route.js  (NEW)
//
// ADMIN DASHBOARD (chat moderation): "search conversations" from the
// spec. Search-only here — opening a specific conversation's actual
// messages is a separate, audit-logged action (see [id]/route.js) per
// the spec's "do not unnecessarily expose private conversations to
// admins without a legitimate moderation/support reason." Listing
// metadata (participants, listing, message count) isn't private in the
// same way message content is, so it's fine to browse without logging
// each row.
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    const conditions = [];
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(sender.email ILIKE $${params.length} OR receiver.email ILIKE $${params.length} OR l.title ILIKE $${params.length})`,
      );
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const result = await pool.query(
      `
      SELECT
        c.id, c.listing_id, l.title AS listing_title,
        sender.email AS sender_email, receiver.email AS receiver_email,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) AS message_count,
        (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id) AS last_message_at
      FROM conversations c
      LEFT JOIN listings l ON l.id = c.listing_id
      JOIN users sender ON sender.id = c.sender_id
      JOIN users receiver ON receiver.id = c.receiver_id
      ${whereClause}
      ORDER BY last_message_at DESC NULLS LAST
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
      params,
    );

    const countResult = await pool.query(
      `
      SELECT COUNT(*) AS total FROM conversations c
      LEFT JOIN listings l ON l.id = c.listing_id
      JOIN users sender ON sender.id = c.sender_id
      JOIN users receiver ON receiver.id = c.receiver_id
      ${whereClause}
      `,
      params.slice(0, params.length - 2),
    );

    return Response.json({ conversations: result.rows, total: Number(countResult.rows[0]?.total || 0) });
  } catch (err) {
    console.error("ADMIN CONVERSATIONS LIST ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}