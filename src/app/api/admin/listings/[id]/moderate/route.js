// ROUTE: src/app/api/admin/listings/[id]/moderate/route.js  (NEW)
//
// Handles approve/hide/reject — the three moderation_status values from
// db/migrations/007_listing_moderation.sql. "Approve" is also how a
// previously hidden/rejected listing gets restored, per the spec's
// "Restore listing" action — there's no separate restore endpoint,
// setting moderation_status back to 'approved' IS the restore.
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminAudit";

const VALID = ["approved", "hidden", "rejected"];

export async function POST(req, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { moderationStatus, reason } = await req.json();

    if (!VALID.includes(moderationStatus)) {
      return Response.json({ error: `moderationStatus must be one of: ${VALID.join(", ")}` }, { status: 400 });
    }

    const existing = await pool.query(`SELECT id, moderation_status FROM listings WHERE id = $1`, [id]);
    if (!existing.rows[0]) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    const updated = await pool.query(
      `
      UPDATE listings
      SET moderation_status = $1, moderation_reason = $2, moderated_by = $3, moderated_at = NOW()
      WHERE id = $4
      RETURNING id, moderation_status
      `,
      [moderationStatus, reason || null, admin.id, id],
    );

    logAdminAction({
      admin,
      action: `listing.moderate.${moderationStatus}`,
      resourceType: "listing",
      resourceId: id,
      previousValue: { moderation_status: existing.rows[0].moderation_status },
      newValue: { moderation_status: moderationStatus },
      reason: reason || null,
      req,
    });

    return Response.json({ listing: updated.rows[0] });
  } catch (err) {
    console.error("ADMIN LISTING MODERATE ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}