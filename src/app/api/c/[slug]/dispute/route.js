import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

const SYSTEM_USER_ID = 1;

export async function POST(req, { params }) {
  const client = await pool.connect();

  try {
    const user = await requireUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gameId = params.gameId;
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    await client.query("BEGIN");

    console.log(conversationId);

    // 1. Get active login delivery (LOCKED to prevent race conditions)
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
WHERE ld.conversation_id  = $1
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

    // 2. Get expiry INSIDE transaction (fixes inconsistency)
    const check = await client.query(
      `
      SELECT expires_at
      FROM login_deliveries
      WHERE conversation_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE
      `,
      [conversationId],
    );

    const record = check.rows[0];

    if (!record) {
      await client.query("ROLLBACK");
      return Response.json({ error: "No delivery found" }, { status: 404 });
    }

    // 🚨 EXPIRED CHECK (unchanged logic, now safe)
    if (record.expires_at && new Date(record.expires_at) < now) {
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

    await client.query(
      `
      UPDATE login_deliveries
      SET disputed = TRUE,
          updated_at = NOW()
      WHERE id = $1
        AND disputed = FALSE
      `,
      [login.id],
    );

    // 5. Freeze escrow transaction
    await client.query(
      `
      UPDATE transactions
      SET escrow_status = 'frozen',
          transaction_status = 'disputed',
          updated_at = NOW()
      WHERE id = $1
      `,
      [login.transaction_id],
    );

    // 6. System message
    await client.query(
      `
      INSERT INTO messages
        (conversation_id, sender_id, message, type, created_at)
      VALUES
        ($1, $2, $3, $4, NOW())
      `,
      [
        conversationId,
        SYSTEM_USER_ID,
        "Buyer raised a dispute. Escrow has been frozen.",
        "dispute",
      ],
    );

    await client.query(
      `
      UPDATE users_transactions
      SET status = 'frozen',
          updated_at = NOW()
      WHERE user_id = $1
        AND reference = $2
        AND status = 'pending'
      `,
      [login.seller_id, login.payment_reference],
    );

    await client.query("COMMIT");

    return Response.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("DISPUTE ERROR:", err);

    return Response.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
