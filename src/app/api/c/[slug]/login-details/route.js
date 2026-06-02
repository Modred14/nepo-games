import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { emitToRoom } from "@/lib/socket";

const SYSTEM_USER_ID = 1;

export async function POST(req, { params }) {
  try {
    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = params;
    const { listingId, details } = await req.json();

    if (!details || !listingId) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. Verify seller owns listing
    const listingRes = await pool.query(
      `SELECT * FROM listings WHERE id = $1`,
      [listingId],
    );

    const listing = listingRes.rows[0];

    if (!listing || Number(listing.user_id) !== Number(user.id)) {
      return Response.json({ error: "Not allowed" }, { status: 403 });
    }

    // 2. Find paid transaction
    const txRes = await pool.query(
      `SELECT * FROM transactions 
       WHERE listing_id = $1 AND buyer_id != $2 AND escrow_status = 'held'
       ORDER BY created_at DESC LIMIT 1`,
      [listingId, user.id],
    );

    const transaction = txRes.rows[0];

    if (!transaction) {
      return Response.json(
        { error: "No paid transaction found" },
        { status: 400 },
      );
    }

    // 3. System notification message
    const notifMsg = await pool.query(
      `INSERT INTO messages
         (conversation_id, sender_id, message, type, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [
        conversationId,
        SYSTEM_USER_ID,
        "Login Details Submitted. Buyer now has 30 minutes to confirm the login details after checking them.",
        "confirm",
      ],
    );

    // 4. Save login details
    const expiry = new Date(Date.now() + 30 * 60 * 1000);

    const loginRes = await pool.query(
      `INSERT INTO login_deliveries
         (transaction_id, listing_id, seller_id, conversation_id, details, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [transaction.id, listingId, user.id, conversationId, details, expiry],
    );

    const login = loginRes.rows[0];

    // 5. Seller confirmation message
    const sellerMsg = await pool.query(
      `INSERT INTO messages
         (conversation_id, sender_id, message, type, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [
        conversationId,
        user.id,
        "Login details have been submitted. Buyer has 30 minutes to confirm.",
        "login_submitted",
      ],
    );

    // 6. Emit to Render socket server
    await emitToRoom(`room:${conversationId}`, "new_message", notifMsg.rows[0]);
    await emitToRoom(
      `room:${conversationId}`,
      "new_message",
      sellerMsg.rows[0],
    );
    await emitToRoom(`room:${conversationId}`, "login_details_ready", {
      conversationId,
      listingId,
    });

    return Response.json({ success: true, login });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
