// ROUTE: src/app/api/admin/transactions/[id]/flag/route.js  (NEW)
//
// ADMIN DASHBOARD PHASE 3: "mark transaction for review" from the spec.
// Purely organizational — does not block or change any automated flow
// (that's what freeze is for, see the sibling route).
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
    const { flagged, reason } = await req.json();

    const existing = await pool.query(
      `SELECT id, flagged_for_review FROM transactions WHERE id = $1`,
      [id],
    );
    if (!existing.rows[0]) {
      return Response.json({ error: "Transaction not found" }, { status: 404 });
    }

    const updated = await pool.query(
      `
      UPDATE transactions
      SET flagged_for_review = $1,
          flagged_reason = $2,
          flagged_by = $3,
          flagged_at = CASE WHEN $1 THEN NOW() ELSE NULL END
      WHERE id = $4
      RETURNING id, flagged_for_review, flagged_reason
      `,
      [Boolean(flagged), flagged ? reason || null : null, admin.id, id],
    );

    logAdminAction({
      admin,
      action: flagged ? "transaction.flag" : "transaction.unflag",
      resourceType: "transaction",
      resourceId: id,
      previousValue: { flagged_for_review: existing.rows[0].flagged_for_review },
      newValue: { flagged_for_review: Boolean(flagged) },
      reason: reason || null,
      req,
    });

    return Response.json({ transaction: updated.rows[0] });
  } catch (err) {
    console.error("ADMIN TRANSACTION FLAG ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}