// ROUTE: src/app/api/admin/withdrawals/[id]/recheck/route.js  (NEW)
//
// Manual counterpart to the automatic reconciliation loop running on
// nepo-games-server-main (see that repo's index.js). Lets an admin force
// an immediate re-check against Flutterwave for one withdrawal — mainly
// useful for rows stuck in 'unknown' (see audit item D.1) or 'pending'
// long past when a webhook should have arrived, without waiting for the
// next automatic sweep.
//
// Goes through the same whitelisted-IP Render proxy as everything else
// that talks to Flutterwave's transfer endpoints — see
// src/lib/flutterwaveTransfer.js for why that's necessary.
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { checkFlutterwaveTransferStatus } from "@/lib/flutterwaveTransfer";

export async function POST(req, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const txRes = await pool.query(
      `SELECT id, reference, status FROM users_transactions
       WHERE id = $1 AND type = 'debit' AND description = 'Withdrawal'`,
      [id],
    );

    const tx = txRes.rows[0];
    if (!tx) {
      return Response.json({ error: "Withdrawal not found" }, { status: 404 });
    }

    const verification = await checkFlutterwaveTransferStatus({
      reference: tx.reference,
    });

    if (verification.ambiguous) {
      return Response.json(
        {
          error: "Could not reach Flutterwave to verify right now, try again shortly",
        },
        { status: 503 },
      );
    }

    const flwStatus = verification.found
      ? String(verification.data?.status || "").toUpperCase()
      : "NOT_FOUND";

    let newStatus = tx.status;
    if (flwStatus === "SUCCESSFUL") newStatus = "success";
    else if (flwStatus === "FAILED" || flwStatus === "NOT_FOUND") newStatus = "failed";
    else if (flwStatus === "NEW" || flwStatus === "PENDING") newStatus = "pending";

    if (newStatus !== tx.status) {
      // WITHDRAWAL FEE (new): update by `reference`, not `id` — the
      // 'Withdrawal fee' credit row (user_id=1) inserted by
      // withdraw/route.js shares this withdrawal's reference specifically
      // so a single status update keeps both rows in sync. Updating by
      // `id` here would only touch the debit row and leave the fee
      // permanently 'pending'.
      await pool.query(`UPDATE users_transactions SET status = $1 WHERE reference = $2`, [
        newStatus,
        tx.reference,
      ]);
    }

    return Response.json({
      id: tx.id,
      previousStatus: tx.status,
      newStatus,
      flutterwaveStatus: flwStatus,
      flutterwaveData: verification.data,
    });
  } catch (err) {
    console.error("ADMIN WITHDRAWAL RECHECK ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}