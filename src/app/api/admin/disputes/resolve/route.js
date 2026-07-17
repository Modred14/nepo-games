// src/app/api/admin/disputes/resolve/route.js
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { emitToRoom } from "@/lib/socket";

const SYSTEM_USER_ID = 1;

// FIX (critical): dispute/route.js could freeze escrow but there was no
// counterpart to actually resolve it — money raised in a dispute was
// permanently stuck pending a manual database edit. This does the two
// things an admin needs to be able to do:
//   - "release_seller": pay the seller as if the buyer had confirmed
//   - "refund_buyer": give the money back to the buyer
//
// NOTE on refunds: this credits the buyer's Nepogames wallet balance for
// the full amount (which they can then withdraw through the existing
// withdraw flow), rather than calling Paystack's refund API directly for
// card-funded purchases. That keeps refund logic identical regardless of
// whether the original payment was "wallet" or "paystack", and avoids
// wiring up a live payment-reversal API call that couldn't be tested here.
// If you'd rather send card-funded refunds straight back to the buyer's
// card/bank via Paystack instead of their in-app wallet, that's a
// deliberate product decision worth making explicitly — happy to wire that
// up separately.
//
// BONUS FIX: neither the original confirm nor dispute flow ever resolved
// the platform's OWN fee ledger row (user_id = 1, credit, 'Platform fee',
// inserted in buy/initialize) — it stayed status='pending' forever, in
// both the success and dispute paths, meaning your platform's fee revenue
// never actually counted toward its own wallet balance (balance
// calculations only sum status='success' rows). This resolves that row
// too, on both outcomes below.
export async function POST(req) {
  const client = await pool.connect();

  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { conversationId, resolution } = await req.json();

    if (!conversationId || !["release_seller", "refund_buyer"].includes(resolution)) {
      return Response.json(
        { error: "conversationId and a valid resolution ('release_seller' or 'refund_buyer') are required" },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    const res = await client.query(
      `
      SELECT
        ld.*,
        t.id AS transaction_id,
        t.buyer_id,
        t.seller_id,
        t.payment_reference,
        t.escrow_status,
        t.amount
      FROM login_deliveries ld
      JOIN transactions t ON t.listing_id = ld.listing_id
      WHERE ld.conversation_id = $1
      ORDER BY ld.created_at DESC
      LIMIT 1
      FOR UPDATE
      `,
      [conversationId],
    );

    const login = res.rows[0];

    if (!login) {
      await client.query("ROLLBACK");
      return Response.json(
        { error: "No delivery/transaction found for this conversation" },
        { status: 404 },
      );
    }

    if (login.escrow_status !== "frozen" || login.disputed !== true) {
      await client.query("ROLLBACK");
      return Response.json(
        { error: "This transaction is not currently under an open dispute" },
        { status: 409 },
      );
    }

    let systemMessage;

    if (resolution === "release_seller") {
      await client.query(
        `UPDATE transactions
         SET escrow_status = 'released', transaction_status = 'completed', updated_at = NOW()
         WHERE id = $1`,
        [login.transaction_id],
      );

      await client.query(
        `UPDATE users_transactions
         SET status = 'success', updated_at = NOW()
         WHERE user_id = $1 AND reference = $2 AND status IN ('pending', 'frozen')`,
        [login.seller_id, login.payment_reference],
      );

      await client.query(
        `UPDATE users_transactions
         SET status = 'success', updated_at = NOW()
         WHERE user_id = 1 AND reference = $1 AND status IN ('pending', 'frozen')
           AND type = 'credit' AND description = 'Platform fee'`,
        [login.payment_reference],
      );

      systemMessage = "Dispute resolved by support: funds have been released to the seller.";
    } else {
      await client.query(
        `UPDATE transactions
         SET escrow_status = 'refunded', transaction_status = 'refunded', updated_at = NOW()
         WHERE id = $1`,
        [login.transaction_id],
      );

      // The seller never gets paid — cancel their pending/frozen credit and
      // the matching platform-fee debit.
      await client.query(
        `UPDATE users_transactions
         SET status = 'failed', updated_at = NOW()
         WHERE user_id = $1 AND reference = $2 AND status IN ('pending', 'frozen')`,
        [login.seller_id, login.payment_reference],
      );

      await client.query(
        `UPDATE users_transactions
         SET status = 'failed', updated_at = NOW()
         WHERE user_id = 1 AND reference = $1 AND status IN ('pending', 'frozen')
           AND type = 'credit' AND description = 'Platform fee'`,
        [login.payment_reference],
      );

      // Refund the buyer to their wallet balance.
      await client.query(
        `INSERT INTO users_transactions (user_id, type, amount, status, description, reference)
         VALUES ($1, 'credit', $2, 'success', 'Dispute refund', $3)`,
        [login.buyer_id, login.amount, `refund_${login.payment_reference}`],
      );

      systemMessage = "Dispute resolved by support: buyer has been refunded to their wallet.";
    }

    await client.query(
      `UPDATE login_deliveries SET disputed = FALSE, updated_at = NOW() WHERE id = $1`,
      [login.id],
    );

    const msgRes = await client.query(
      `INSERT INTO messages (conversation_id, sender_id, message, type, created_at)
       VALUES ($1, $2, $3, 'dispute_resolved', NOW())
       RETURNING *`,
      [conversationId, SYSTEM_USER_ID, systemMessage],
    );

    await client.query("COMMIT");

    // Notification failures shouldn't turn an already-committed resolution
    // into a false "Server error" — same pattern as dispute/route.js.
    try {
      await emitToRoom(`room:${conversationId}`, "new_message", msgRes.rows[0]);
      await emitToRoom(`user:${login.buyer_id}`, "sidebar_update", {});
      await emitToRoom(`user:${login.seller_id}`, "sidebar_update", {});
    } catch (notifyErr) {
      console.error("DISPUTE RESOLVE: socket emit failed (resolution still recorded):", notifyErr);
    }

    return Response.json({ success: true, resolution });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // transaction may already be closed — ignore
    }
    console.error("DISPUTE RESOLVE ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
}