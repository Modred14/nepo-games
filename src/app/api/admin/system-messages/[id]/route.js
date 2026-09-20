// ROUTE: src/app/api/admin/system-messages/[id]/route.js  (NEW)
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminAudit";

export async function PATCH(req, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();

    const existing = await pool.query(`SELECT * FROM system_messages WHERE id = $1`, [id]);
    if (!existing.rows[0]) {
      return Response.json({ error: "Announcement not found" }, { status: 404 });
    }
    const before = existing.rows[0];

    const title = body.title !== undefined ? body.title : before.title;
    const message = body.message !== undefined ? body.message : before.message;
    const type = body.type !== undefined ? body.type : before.type;
    const enabled = body.enabled !== undefined ? Boolean(body.enabled) : before.enabled;
    const startsAt = body.startsAt !== undefined ? body.startsAt : before.starts_at;
    const endsAt = body.endsAt !== undefined ? body.endsAt : before.ends_at;

    const updated = await pool.query(
      `
      UPDATE system_messages
      SET title = $1, message = $2, type = $3, enabled = $4, starts_at = $5, ends_at = $6
      WHERE id = $7
      RETURNING *
      `,
      [title, message, type, enabled, startsAt || null, endsAt || null, id],
    );

    logAdminAction({
      admin,
      action: "announcement.update",
      resourceType: "announcement",
      resourceId: id,
      previousValue: { enabled: before.enabled, title: before.title },
      newValue: { enabled, title },
      req,
    });

    return Response.json(updated.rows[0]);
  } catch (err) {
    console.error("ADMIN ANNOUNCEMENT UPDATE ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const existing = await pool.query(`SELECT id, title FROM system_messages WHERE id = $1`, [id]);
    if (!existing.rows[0]) {
      return Response.json({ error: "Announcement not found" }, { status: 404 });
    }

    await pool.query(`DELETE FROM system_messages WHERE id = $1`, [id]);

    logAdminAction({
      admin,
      action: "announcement.delete",
      resourceType: "announcement",
      resourceId: id,
      previousValue: { title: existing.rows[0].title },
      req,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("ADMIN ANNOUNCEMENT DELETE ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}