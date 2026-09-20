// ROUTE: src/app/api/admin/transactions/[id]/resolve/route.js  (NEW)
//
// ADMIN DASHBOARD PHASE 3: generalized "release escrow" / "refund buyer"
// for ANY transaction currently holding funds in escrow — not just ones
// under an open dispute. src/app/api/admin/disputes/resolve/route.js
// intentionally only works when escrow_status='frozen' AND disputed=true
// (that's correct and unchanged for the Disputes page), which is too
// narrow for general transaction investigation: an admin should be able
// to release or refund a transaction they've been investigating even if
// the buyer never formally opened a dispute.
//
// This deliberately reuses the EXACT same careful pattern already proven
// in disputes/resolve/route.js — row locking (FOR UPDATE), the same
// ledger-reversal logic, the same audit log — rather than a second,
// less-vetted implementation. The only real difference is the
// precondition: any currently-held escrow (held/holding/frozen — the
// codebase uses both 'held' and 'holding' inconsistently, both are
// accepted) instead of "held AND disputed". A confirmation + reason is
// required by the admin UI before this is ever called, per the original
// spec's "DO NOT create dangerous one-click money movement functionality
// without proper safeguards".
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { emitToRoom } from "@/lib/socket";
import { logAdminAction } from "@/lib/adminAudit";
import { checkRateLimit } from "@/lib/rateLimit";
import { verifyReauthToken } from "@/lib/reauth";

const SYSTEM_USER_ID = 1;
const HELD_STATUSES = ["held", "holding", "frozen"];

export async function POST(req, { params }) {
  const client = await pool.connect();

  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Max 10 release/refund actions per admin per 5 minutes — a real
    // investigation moving money on several transactions in a row is
    // still well within this; a stuck script or a compromised session
    // firing this repeatedly is not.
    const rl = await checkRateLimit(`tx-resolve:${admin.id}`, { limit: 10, windowSeconds: 300 });
    if (!rl.allowed) {
      return Response.json(
        { error: "Too many resolve actions in a short time. Wait a few minutes and try again." },
        { status: 429 },
      );
    }

    // ADMIN DASHBOARD: actual re-authentication, not just confirmation —
    // this moves real money, so a plain window.confirm() isn't enough
    // (see src/lib/reauth.js). The client must have already called
    // POST /api/admin/reauth with action "transaction.resolve" and
    // include the returned token here.
    if (!verifyReauthToken(req, { adminId: admin.id, action: "transaction.resolve" })) {
      return Response.json(
        { error: "Re-authentication required or expired. Please confirm your password/PIN and try again." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const { resolution, reason } = await req.json();

    if (!["release_seller", "refund_buyer"].includes(resolution)) {
      return Response.json(
        { error: "resolution must be 'release_seller' or 'refund_buyer'" },
        { status: 400 },
      );
    }
    if (!reason || !reason.trim()) {
      // Unlike the disputes flow (where the dispute itself is the
      // documented reason), this broader action has no such context, so
      // a reason is required, not optional.
      return Response.json(
        { error: "A reason is required for this action" },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    const res = await client.query(
      `
      SELECT t.*, ld.conversation_id, ld.id AS delivery_id
      FROM transactions t
      LEFT JOIN LATERAL (
        SELECT id, conversation_id FROM login_deliveries
        WHERE login_deliveries.listing_id = t.listing_id
        ORDER BY created_at DESC LIMIT 1
      ) ld ON true
      WHERE t.id = $1
      FOR UPDATE
      `,
      [id],
    );

    const tx = res.rows[0];
    if (!tx) {
      await client.query("ROLLBACK");
      return Response.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (!HELD_STATUSES.includes(tx.escrow_status)) {
      await client.query("ROLLBACK");
      return Response.json(
        { error: `Escrow is '${tx.escrow_status}', not currently held — nothing to resolve` },
        { status: 409 },
      );
    }

    let systemMessage;

    if (resolution === "release_seller") {
      await client.query(
        `UPDATE transactions
         SET escrow_status = 'released', transaction_status = 'completed', frozen = false, updated_at = NOW()
         WHERE id = $1`,
        [tx.id],
      );
      await client.query(
        `UPDATE users_transactions SET status = 'success', updated_at = NOW()
         WHERE user_id = $1 AND reference = $2 AND status IN ('pending', 'frozen')`,
        [tx.seller_id, tx.payment_reference],
      );
      await client.query(
        `UPDATE users_transactions SET status = 'success', updated_at = NOW()
         WHERE user_id = 1 AND reference = $1 AND status IN ('pending', 'frozen')
           AND type = 'credit' AND description = 'Platform fee'`,
        [tx.payment_reference],
      );
      systemMessage = "An admin has released this transaction's funds to the seller.";
    } else {
      await client.query(
        `UPDATE transactions
         SET escrow_status = 'refunded', transaction_status = 'refunded', frozen = false, updated_at = NOW()
         WHERE id = $1`,
        [tx.id],
      );
      await client.query(
        `UPDATE users_transactions SET status = 'failed', updated_at = NOW()
         WHERE user_id = $1 AND reference = $2 AND status IN ('pending', 'frozen')`,
        [tx.seller_id, tx.payment_reference],
      );
      await client.query(
        `UPDATE users_transactions SET status = 'failed', updated_at = NOW()
         WHERE user_id = 1 AND reference = $1 AND status IN ('pending', 'frozen')
           AND type = 'credit' AND description = 'Platform fee'`,
        [tx.payment_reference],
      );
      await client.query(
        `INSERT INTO users_transactions (user_id, type, amount, status, description, reference, affects_balance)
         VALUES ($1, 'credit', $2, 'success', 'Admin refund', $3, true)`,
        [tx.buyer_id, tx.amount, `adminrefund_${tx.payment_reference}`],
      );
      systemMessage = "An admin has refunded this transaction to the buyer's wallet.";
    }

    if (tx.delivery_id) {
      await client.query(
        `UPDATE login_deliveries SET disputed = FALSE, updated_at = NOW() WHERE id = $1`,
        [tx.delivery_id],
      );
    }

    let msgRow = null;
    if (tx.conversation_id) {
      const msgRes = await client.query(
        `INSERT INTO messages (conversation_id, sender_id, message, type, created_at)
         VALUES ($1, $2, $3, 'dispute_resolved', NOW())
         RETURNING *`,
        [tx.conversation_id, SYSTEM_USER_ID, systemMessage],
      );
      msgRow = msgRes.rows[0];
    }

    await client.query("COMMIT");

    logAdminAction({
      admin,
      action: `transaction.resolve.${resolution}`,
      resourceType: "transaction",
      resourceId: tx.id,
      previousValue: { escrow_status: tx.escrow_status },
      newValue: {
        escrow_status: resolution === "release_seller" ? "released" : "refunded",
      },
      reason,
      req,
    });

    try {
      if (tx.conversation_id && msgRow) {
        await emitToRoom(`room:${tx.conversation_id}`, "new_message", msgRow);
      }
      await emitToRoom(`user:${tx.buyer_id}`, "sidebar_update", {});
      await emitToRoom(`user:${tx.seller_id}`, "sidebar_update", {});
    } catch (notifyErr) {
      console.error("ADMIN TRANSACTION RESOLVE: socket emit failed (resolution still recorded):", notifyErr);
    }

    return Response.json({ success: true, resolution });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error("ADMIN TRANSACTION RESOLVE ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
}