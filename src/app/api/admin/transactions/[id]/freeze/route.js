// ROUTE: src/app/api/admin/transactions/[id]/freeze/route.js  (NEW)
//
// ADMIN DASHBOARD PHASE 3: actually enforced, unlike "flag" — a frozen
// transaction is skipped by the auto-release cron
// (src/app/api/cron/release-escrow/route.js) and can't be confirmed by
// the buyer (src/app/api/c/[slug]/confirm/route.js) while frozen. Only
// meaningful while money is still in escrow — freezing an already
// released/refunded transaction wouldn't do anything, so that's blocked
// below rather than silently accepted.
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminAudit";

const HELD_STATUSES = ["held", "holding", "frozen"];

export async function POST(req, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { frozen, reason } = await req.json();

    const existing = await pool.query(
      `SELECT id, escrow_status, frozen FROM transactions WHERE id = $1`,
      [id],
    );
    const tx = existing.rows[0];
    if (!tx) {
      return Response.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (frozen && !HELD_STATUSES.includes(tx.escrow_status)) {
      return Response.json(
        { error: `Can't freeze — escrow is already '${tx.escrow_status}', not currently held` },
        { status: 409 },
      );
    }

    const updated = await pool.query(
      `
      UPDATE transactions
      SET frozen = $1,
          frozen_reason = $2,
          frozen_by = $3,
          frozen_at = CASE WHEN $1 THEN NOW() ELSE NULL END
      WHERE id = $4
      RETURNING id, frozen, frozen_reason
      `,
      [Boolean(frozen), frozen ? reason || null : null, admin.id, id],
    );

    logAdminAction({
      admin,
      action: frozen ? "transaction.freeze" : "transaction.unfreeze",
      resourceType: "transaction",
      resourceId: id,
      previousValue: { frozen: tx.frozen },
      newValue: { frozen: Boolean(frozen) },
      reason: reason || null,
      req,
    });

    return Response.json({ transaction: updated.rows[0] });
  } catch (err) {
    console.error("ADMIN TRANSACTION FREEZE ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}