import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getIO } from "@/lib/socket";

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

    // 1. Get active login delivery (LOCKED)
    const res = await client.query(
      `
      SELECT 
        ld.*, 
        t.id AS transaction_id, 
        t.buyer_id, 
        t.seller_id, 
        t.payment_reference, 
        t.escrow_status
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

    if (login.expires_at && new Date(login.expires_at) < now) {
      await client.query("ROLLBACK");
      return Response.json(
        { error: "Delivery expired. Contact support." },
        { status: 403 },
      );
    }

    if (Number(login.buyer_id) !== Number(user.id)) {
      await client.query("ROLLBACK");
      return Response.json({ error: "Not allowed" }, { status: 403 });
    }

    if (login.disputed === true) {
      await client.query("ROLLBACK");
      return Response.json({ error: "Already disputed" }, { status: 409 });
    }

    if (login.escrow_status === "released") {
      await client.query("ROLLBACK");
      return Response.json(
        { error: "Cannot dispute a released transaction" },
        { status: 409 },
      );
    }

    // 2. Mark as disputed
    await client.query(
      `UPDATE login_deliveries
       SET disputed = TRUE,
           updated_at = NOW()
       WHERE id = $1
         AND disputed = FALSE`,
      [login.id],
    );

    // 3. Freeze escrow
    await client.query(
      `UPDATE transactions
       SET escrow_status = 'frozen',
           transaction_status = 'disputed',
           updated_at = NOW()
       WHERE id = $1`,
      [login.transaction_id],
    );

    // 4. System message
    const systemMsg = await client.query(
      `INSERT INTO messages
         (conversation_id, sender_id, message, type, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [
        conversationId,
        SYSTEM_USER_ID,
        "Buyer raised a dispute. Escrow has been frozen.",
        "dispute",
      ],
    );

    // 5. Freeze seller transaction
    await client.query(
      `UPDATE users_transactions
       SET status = 'frozen',
           updated_at = NOW()
       WHERE user_id = $1
         AND reference = $2
         AND status = 'pending'`,
      [login.seller_id, login.payment_reference],
    );

    await client.query("COMMIT");

    // 6. EMIT system message to both users in the room
    try {
      const io = getIO();
      if (io) {
        io.to(`room:${conversationId}`).emit("new_message", systemMsg.rows[0]);
      }
    } catch (err) {
      console.error("Socket emit failed (non-critical):", err);
    }

    return Response.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("DISPUTE ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
