// ROUTE: src/app/api/admin/listings/[id]/delete/route.js  (NEW)
//
// Soft delete via `deleted_at` — a column that already existed and was
// already filtered on in src/app/api/market/route.js, but had no
// producer anywhere in the codebase (the seller's own delete route,
// src/app/api/listing/delete/route.js, does a hard DELETE instead).
// This is the first thing that actually sets it. Same
// currently-mid-checkout guard as that route, so an admin can't delete a
// listing out from under a buyer who's actively paying for it.
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
    const { restore, reason } = await req.json();

    const existing = await pool.query(
      `SELECT id, status, deleted_at FROM listings WHERE id = $1`,
      [id],
    );
    const listing = existing.rows[0];
    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    if (!restore && listing.status === "processing") {
      return Response.json(
        { error: "Cannot delete a listing that is currently being purchased" },
        { status: 400 },
      );
    }

    const updated = await pool.query(
      `UPDATE listings SET deleted_at = $1 WHERE id = $2 RETURNING id, deleted_at`,
      [restore ? null : new Date(), id],
    );

    logAdminAction({
      admin,
      action: restore ? "listing.restore" : "listing.delete",
      resourceType: "listing",
      resourceId: id,
      previousValue: { deleted_at: listing.deleted_at },
      newValue: { deleted_at: updated.rows[0].deleted_at },
      reason: reason || null,
      req,
    });

    return Response.json({ listing: updated.rows[0] });
  } catch (err) {
    console.error("ADMIN LISTING DELETE ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}