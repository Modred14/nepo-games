// ROUTE: src/app/api/admin/users/[id]/messaging-restriction/route.js  (NEW)
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminAudit";

export async function POST(req, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { restricted, reason } = await req.json();

    const existing = await pool.query(`SELECT id, messaging_restricted FROM users WHERE id = $1`, [id]);
    if (!existing.rows[0]) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await pool.query(
      `UPDATE users SET messaging_restricted = $1 WHERE id = $2 RETURNING id, messaging_restricted`,
      [Boolean(restricted), id],
    );

    logAdminAction({
      admin,
      action: restricted ? "user.messaging_restrict" : "user.messaging_unrestrict",
      resourceType: "user",
      resourceId: id,
      previousValue: { messaging_restricted: existing.rows[0].messaging_restricted },
      newValue: { messaging_restricted: Boolean(restricted) },
      reason: reason || null,
      req,
    });

    return Response.json({ user: updated.rows[0] });
  } catch (err) {
    console.error("ADMIN MESSAGING RESTRICTION ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}