// ROUTE: src/app/api/admin/audit-logs/route.js  (NEW)
//
// ADMIN DASHBOARD PHASE 1: read-only view onto admin_audit_log (see
// db/migrations/003_admin_roles_and_audit_log.sql). Table is INSERT-only
// from the app's perspective — there's deliberately no PATCH/DELETE
// route here or anywhere else, per the "audit logs should be immutable
// to normal admins" requirement.
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const resourceType = searchParams.get("resourceType");
    const action = searchParams.get("action");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    const result = await pool.query(
      `
      SELECT
        l.id,
        l.admin_id,
        u.email AS admin_email,
        l.action,
        l.resource_type,
        l.resource_id,
        l.previous_value,
        l.new_value,
        l.reason,
        l.ip_address,
        l.created_at
      FROM admin_audit_log l
      LEFT JOIN users u ON u.id = l.admin_id
      WHERE ($1::text IS NULL OR l.resource_type = $1)
        AND ($2::text IS NULL OR l.action = $2)
      ORDER BY l.created_at DESC
      LIMIT $3 OFFSET $4
      `,
      [resourceType || null, action || null, limit, offset],
    );

    return Response.json({ logs: result.rows });
  } catch (err) {
    console.error("ADMIN AUDIT LOG LIST ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}