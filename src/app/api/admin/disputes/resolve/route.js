import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { emitToRoom } from "@/lib/socket";

const SYSTEM_USER_ID = 1;
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

      await client.query(
        `INSERT INTO users_transactions (user_id, type, amount, status, description, reference, affects_balance)
         VALUES ($1, 'credit', $2, 'success', 'Dispute refund', $3, true)`,
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
     console.log("")
    }
    console.error("DISPUTE RESOLVE ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
}