// ROUTE: src/app/api/admin/system-messages/route.js
//
// ADMIN DASHBOARD PHASE 5: "Announcements" from the original spec, built
// on the existing system_messages table (per the site owner's decision
// to extend what exists rather than add a parallel system) — see
// db/migrations/008_announcement_scheduling.sql for the new
// type/enabled/starts_at/ends_at columns this now uses. GET (list, for
// the admin page) is new; POST (create) is the original handler,
// extended to accept the new fields and to log to admin_audit_log.
import pool from "../../../../lib/db";
import { requireUser, requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminAudit";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const result = await pool.query(
    `
    SELECT sm.*, u.email AS created_by_email
    FROM system_messages sm
    LEFT JOIN users u ON u.id = sm.created_by
    ORDER BY sm.created_at DESC
    `,
  );
  return Response.json({ announcements: result.rows });
}

export async function POST(req) {
  try {
    const user = await requireUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const admin = await requireAdmin();
    if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { title, message, type, startsAt, endsAt } = await req.json();

    if (!message) {
      return Response.json({ error: "Message required" }, { status: 400 });
    }

    const validTypes = ["info", "warning", "promo", "maintenance"];
    const finalType = validTypes.includes(type) ? type : "info";

    const result = await pool.query(
      `
      INSERT INTO system_messages (title, message, type, starts_at, ends_at, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [title, message, finalType, startsAt || null, endsAt || null, admin.id],
    );

    logAdminAction({
      admin,
      action: "announcement.create",
      resourceType: "announcement",
      resourceId: result.rows[0].id,
      newValue: { title, type: finalType, startsAt: startsAt || null, endsAt: endsAt || null },
      req,
    });

    return Response.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}