// src/app/api/c/[slug]/confirm/route.js
// ROUTE: src/app/api/c/[slug]/confirm/route.js
//
// ADMIN DASHBOARD PHASE 3: a buyer can no longer confirm/release a
// transaction an admin has frozen (see
// src/app/api/admin/transactions/[id]/freeze/route.js) — see check #4a
// below. Without this, freezing would only stop the automatic cron
// release, not a buyer manually clicking confirm, which would make
// "freeze" an incomplete safeguard.
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { emitToRoom } from "@/lib/socket";

const SYSTEM_USER_ID = 1;

export async function POST(req, { params }) {
  const client = await pool.connect();

  try {
    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    await client.query("BEGIN");

    // 1. Lock latest delivery
    const res = await client.query(
      `
      SELECT 
        ld.*, 
        t.id AS transaction_id, 
        t.buyer_id, 
        t.seller_id, 
        t.payment_reference, 
        t.escrow_status,
        t.frozen
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
        { error: "No active delivery found" },
        { status: 404 },
      );
    }

    const now = new Date();

    // 2. Expiry check
    if (login.expires_at && new Date(login.expires_at) < now) {
      await client.query("ROLLBACK");
      return Response.json(
        { error: "Delivery expired. Contact support." },
        { status: 403 },
      );
    }

    // 3. Ownership check
    if (Number(login.buyer_id) !== Number(user.id)) {
      await client.query("ROLLBACK");
      return Response.json({ error: "Not allowed" }, { status: 403 });
    }

    // 4. Already disputed?
    if (login.disputed === true) {
      await client.query("ROLLBACK");
      return Response.json(
        { error: "Cannot confirm a disputed delivery" },
        { status: 409 },
      );
    }

    // 4a. Frozen by an admin?
    if (login.frozen === true) {
      await client.query("ROLLBACK");
      return Response.json(
        { error: "This transaction is under review and can't be confirmed right now. Contact support." },
        { status: 409 },
      );
    }

    // 5. Already confirmed?
    if (login.confirmed === true || login.released_to_seller === true) {
      await client.query("ROLLBACK");
      return Response.json({ error: "Already confirmed" }, { status: 409 });
    }

    // 6. Update delivery
    await client.query(
      `UPDATE login_deliveries
       SET confirmed = TRUE,
           released_to_seller = TRUE,
           released_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [login.id],
    );

    // 7. Release escrow
    await client.query(
      `UPDATE transactions
       SET escrow_status = 'released',
           transaction_status = 'completed',
           updated_at = NOW()
       WHERE id = $1`,
      [login.transaction_id],
    );

    // 8. Credit seller
    await client.query(
      `UPDATE users_transactions
       SET status = 'success',
           updated_at = NOW()
       WHERE user_id = $1
         AND reference = $2
         AND status = 'pending'`,
      [login.seller_id, login.payment_reference],
    );
    await client.query(
      `UPDATE users_transactions
   SET status = 'success',
       updated_at = NOW()
   WHERE user_id = $1
     AND reference = $2
     AND status = 'pending'
     AND description = 'Platform fee'`,
      [1, login.payment_reference],
    );

    // 9. System message
    const systemMsg = await client.query(
      `INSERT INTO messages
         (conversation_id, sender_id, message, type, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [
        conversationId,
        SYSTEM_USER_ID,
        "Buyer confirmed delivery. Money has been released to seller.",
        "confirm",
      ],
    );

    await client.query("COMMIT");

    // 10. Emit to Render socket server
    await emitToRoom(
      `room:${conversationId}`,
      "new_message",
      systemMsg.rows[0],
    );
    await emitToRoom(`user:${login.buyer_id}`, "sidebar_update", {});
    await emitToRoom(`user:${login.seller_id}`, "sidebar_update", {});

    return Response.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("CONFIRM ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
}