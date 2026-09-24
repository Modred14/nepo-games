// ROUTE: src/app/api/admin/reports/[id]/resolve/route.js  (NEW)
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminAudit";

const VALID_STATUSES = ["reviewed", "dismissed"];

export async function POST(req, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { status, restrictUser } = await req.json();

    if (!VALID_STATUSES.includes(status)) {
      return Response.json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }

    const existing = await pool.query(`SELECT id, status, reported_user_id FROM reports WHERE id = $1`, [id]);
    if (!existing.rows[0]) {
      return Response.json({ error: "Report not found" }, { status: 404 });
    }

    const updated = await pool.query(
      `UPDATE reports SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3 RETURNING *`,
      [status, admin.id, id],
    );

    logAdminAction({
      admin,
      action: `report.${status}`,
      resourceType: "report",
      resourceId: id,
      previousValue: { status: existing.rows[0].status },
      newValue: { status },
      req,
    });

    if (restrictUser) {
      await pool.query(`UPDATE users SET messaging_restricted = true WHERE id = $1`, [
        existing.rows[0].reported_user_id,
      ]);
      logAdminAction({
        admin,
        action: "user.messaging_restrict",
        resourceType: "user",
        resourceId: existing.rows[0].reported_user_id,
        newValue: { messaging_restricted: true },
        reason: `Via report #${id}`,
        req,
      });
    }

    return Response.json({ report: updated.rows[0] });
  } catch (err) {
    console.error("ADMIN REPORT RESOLVE ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}