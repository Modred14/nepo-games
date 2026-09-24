// ROUTE: src/app/api/admin/conversations/[id]/route.js  (NEW)
//
// ADMIN DASHBOARD (chat moderation): actual message content for one
// conversation. Unlike the search list, THIS is logged to
// admin_audit_log on every view — the spec is explicit that private
// conversations shouldn't be exposed to admins "without a legitimate
// moderation/support reason," so every time an admin actually reads
// someone's messages, there's a record of who did it and when. This is
// read-only and doesn't require a reason prompt (that would slow down
// legitimate investigation from a report/dispute), but it is never
// silent.
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminAudit";

export async function GET(req, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const convoRes = await pool.query(
      `
      SELECT c.id, c.listing_id, l.title AS listing_title,
             sender.id AS sender_id, sender.email AS sender_email,
             receiver.id AS receiver_id, receiver.email AS receiver_email
      FROM conversations c
      LEFT JOIN listings l ON l.id = c.listing_id
      JOIN users sender ON sender.id = c.sender_id
      JOIN users receiver ON receiver.id = c.receiver_id
      WHERE c.id = $1
      `,
      [id],
    );
    const conversation = convoRes.rows[0];
    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    const messagesRes = await pool.query(
      `
      SELECT m.id, m.sender_id, m.message, m.type, m.created_at, u.email AS sender_email
      FROM messages m
      LEFT JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
      LIMIT 500
      `,
      [id],
    );

    // Audit the view itself — see the file header for why.
    logAdminAction({
      admin,
      action: "conversation.view",
      resourceType: "conversation",
      resourceId: id,
      newValue: { participants: [conversation.sender_email, conversation.receiver_email] },
      req,
    });

    return Response.json({ conversation, messages: messagesRes.rows });
  } catch (err) {
    console.error("ADMIN CONVERSATION VIEW ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}