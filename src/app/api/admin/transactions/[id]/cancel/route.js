// ROUTE: src/app/api/admin/transactions/[id]/cancel/route.js  (NEW)
//
// ADMIN DASHBOARD PHASE 3: "cancel transaction" from the spec, scoped
// specifically to transactions where payment never actually completed
// (transaction_status IN ('initiated', 'pending')) — no escrow to
// reverse, no money to move, just an admin unsticking a stale/abandoned
// checkout. This mirrors the exact pattern already used for this in
// src/app/api/paystack/buy/initialize/route.js when a buyer starts a
// second checkout on a listing stuck in 'processing'. For a transaction
// that already moved money into escrow, use resolve (release/refund)
// instead — cancel deliberately refuses those, see the check below.
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminAudit";

const CANCELLABLE_STATUSES = ["initiated", "pending"];

export async function POST(req, { params }) {
  const client = await pool.connect();

  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { reason } = await req.json();

    await client.query("BEGIN");

    const res = await client.query(
      `SELECT id, listing_id, transaction_status, escrow_status FROM transactions WHERE id = $1 FOR UPDATE`,
      [id],
    );
    const tx = res.rows[0];
    if (!tx) {
      await client.query("ROLLBACK");
      return Response.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (!CANCELLABLE_STATUSES.includes(tx.transaction_status)) {
      await client.query("ROLLBACK");
      return Response.json(
        {
          error: `Only transactions still in 'initiated' or 'pending' can be cancelled this way (this one is '${tx.transaction_status}'). If money is already in escrow, use release/refund instead.`,
        },
        { status: 409 },
      );
    }

    await client.query(
      `UPDATE transactions SET transaction_status = 'cancelled', payment_status = 'failed', updated_at = NOW() WHERE id = $1`,
      [id],
    );

    if (tx.listing_id) {
      await client.query(
        `UPDATE listings SET status = 'active', processing_by = NULL WHERE id = $1 AND status = 'processing'`,
        [tx.listing_id],
      );
    }

    await client.query("COMMIT");

    logAdminAction({
      admin,
      action: "transaction.cancel",
      resourceType: "transaction",
      resourceId: id,
      previousValue: { transaction_status: tx.transaction_status },
      newValue: { transaction_status: "cancelled" },
      reason: reason || null,
      req,
    });

    return Response.json({ success: true });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error("ADMIN TRANSACTION CANCEL ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
}