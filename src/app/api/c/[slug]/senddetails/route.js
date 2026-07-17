// src/app/api/c/[slug]/senddetails/route.js
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { emitToRoom } from "@/lib/socket";

const SYSTEM_USER_ID = 1;
const DELIVERY_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

export async function POST(req, { params }) {
  const client = await pool.connect();

  try {
    const user = await requireUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return Response.json(
        { error: "Missing conversationId" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { listingId, details } = body;

    if (!listingId || !details) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    // FIX (critical): this endpoint previously inserted a login_deliveries
    // row for ANY authenticated user, for ANY listingId/conversationId they
    // supplied — no check that they actually own the listing, or that a
    // real paid transaction even exists. That let anyone inject fake
    // credential-delivery messages into someone else's transaction. Both
    // checks below are the same ones the (unused, and itself buggy) sibling
    // route `login-details/route.js` was supposed to provide.

    // 1. Verify the requester actually owns this listing.
    const listingRes = await client.query(
      `SELECT * FROM listings WHERE id = $1 FOR UPDATE`,
      [listingId],
    );
    const listing = listingRes.rows[0];

    if (!listing) {
      await client.query("ROLLBACK");
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    if (Number(listing.user_id) !== Number(user.id)) {
      await client.query("ROLLBACK");
      return Response.json({ error: "Not allowed" }, { status: 403 });
    }

    // 2. Verify there's an actual paid, still-in-escrow transaction for
    // this listing with this user as the seller. FIX: the original
    // (unused) version of this check filtered `escrow_status = 'held'`,
    // but every other route in this codebase writes 'holding' — that typo
    // meant the check could never match anything. Use the real value.
    const txRes = await client.query(
      `SELECT * FROM transactions
       WHERE listing_id = $1
         AND seller_id = $2
         AND payment_status = 'paid'
         AND escrow_status = 'holding'
       ORDER BY created_at DESC LIMIT 1`,
      [listingId, user.id],
    );
    const transaction = txRes.rows[0];

    if (!transaction) {
      await client.query("ROLLBACK");
      return Response.json(
        { error: "No paid transaction found" },
        { status: 400 },
      );
    }

    // 3. Save login details with a real expiry. FIX: this previously never
    // set expires_at, so the "auto-expires in 30 minutes" shown to buyers
    // in the UI did nothing server-side — confirm/dispute's expiry check
    // (`if (login.expires_at && ...)`) silently no-ops on a null value.
    //
    // NOTE: not storing transaction_id here — confirm/dispute both get the
    // transaction id via their own JOIN (`t.id AS transaction_id`), so it
    // isn't needed on this row, and I don't have confirmation that column
    // exists on the real login_deliveries table (it only appears in the
    // unused, separately-buggy sibling route, which has never run
    // successfully against production). Verify it during testing — if it
    // does exist, feel free to add it back in.
    const expiresAt = new Date(Date.now() + DELIVERY_WINDOW_MS);

    const result = await client.query(
      `
      INSERT INTO login_deliveries
      (listing_id, conversation_id, seller_id, details, expires_at, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
      `,
      [listingId, conversationId, user.id, details, expiresAt],
    );

    const login = result.rows[0];

    // 4. System + seller messages, matching the copy already used
    // elsewhere in the app for this event.
    const notifMsg = await client.query(
      `INSERT INTO messages
         (conversation_id, sender_id, message, type, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [
        conversationId,
        SYSTEM_USER_ID,
        "Login details submitted. Buyer now has 30 minutes to confirm the login details after checking them.",
        "confirm",
      ],
    );

    await client.query("COMMIT");

    // Emit outside the transaction, same pattern as confirm/route.js.
    await emitToRoom(`room:${conversationId}`, "new_message", notifMsg.rows[0]);
    await emitToRoom(`room:${conversationId}`, "login_details_ready", {
      conversationId,
      listingId,
    });

    return Response.json({
      success: true,
      data: login,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("LOGIN DETAILS POST ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
}