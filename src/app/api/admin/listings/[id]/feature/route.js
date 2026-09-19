// ROUTE: src/app/api/admin/listings/[id]/feature/route.js  (NEW)
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
    const { featured } = await req.json();

    const existing = await pool.query(`SELECT id, featured FROM listings WHERE id = $1`, [id]);
    if (!existing.rows[0]) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    const updated = await pool.query(
      `UPDATE listings SET featured = $1 WHERE id = $2 RETURNING id, featured`,
      [Boolean(featured), id],
    );

    logAdminAction({
      admin,
      action: featured ? "listing.feature" : "listing.unfeature",
      resourceType: "listing",
      resourceId: id,
      previousValue: { featured: existing.rows[0].featured },
      newValue: { featured: Boolean(featured) },
      req,
    });

    return Response.json({ listing: updated.rows[0] });
  } catch (err) {
    console.error("ADMIN LISTING FEATURE ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}