// ROUTE: src/app/api/c/[slug]/senddetails/route.js
//
// Seller submits the game-account login details after the buyer has paid.
// SECURITY (audit hardening):
//  - The conversation is no longer taken on trust from the query string. It
//    must be the conversation between THIS seller and the buyer of the paid
//    order for THIS listing — previously a seller could drop a "login details
//    submitted" delivery + system message into any conversation id.
//  - Only one delivery per conversation (no resubmitting to reset the buyer's
//    confirmation countdown).
//  - Input is validated (type, length) and the order must be paid, held and
//    not frozen.
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { emitToRoom } from "@/lib/socket";
import { getSetting } from "@/lib/settings";
import { checkRateLimit, tooManyRequests } from "@/lib/rateLimit";
import { encryptSecret, encryptionConfigured, withDecryptedDetails } from "@/lib/secretBox";

const SYSTEM_USER_ID = 1;
const MAX_DETAILS_LENGTH = 2000;

export async function POST(req) {
  const client = await pool.connect();

  try {
    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(`senddetails:${user.id}`, { limit: 10, windowSeconds: 300 });
    if (!rl.allowed) return tooManyRequests();

    const { searchParams } = new URL(req.url);
    const conversationId = Number(searchParams.get("conversationId"));
    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return Response.json({ error: "Missing conversationId" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const listingId = Number(body?.listingId);
    const details = typeof body?.details === "string" ? body.details.trim() : "";

    if (!Number.isInteger(listingId) || listingId <= 0 || !details) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (details.length > MAX_DETAILS_LENGTH) {
      return Response.json({ error: "Login details are too long" }, { status: 400 });
    }

    // Credentials are encrypted at rest. In production we refuse to store them
    // in plaintext if the key is missing.
    const canEncrypt = encryptionConfigured();
    if (!canEncrypt && process.env.NODE_ENV === "production") {
      console.error("LOGIN_DETAILS_ENCRYPTION_KEY is not configured");
      return Response.json({ error: "Server configuration error" }, { status: 500 });
    }
    const storedDetails = canEncrypt ? encryptSecret(details) : details;

    await client.query("BEGIN");

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

    const txRes = await client.query(
      `SELECT * FROM transactions
        WHERE listing_id = $1
          AND seller_id = $2
          AND payment_status = 'paid'
          AND escrow_status = 'holding'
        ORDER BY created_at DESC LIMIT 1
        FOR UPDATE`,
      [listingId, user.id],
    );
    const transaction = txRes.rows[0];

    if (!transaction) {
      await client.query("ROLLBACK");
      return Response.json({ error: "No paid transaction found" }, { status: 400 });
    }

    if (transaction.frozen === true) {
      await client.query("ROLLBACK");
      return Response.json(
        { error: "This transaction is under review. Contact support." },
        { status: 409 },
      );
    }

    // The conversation must be seller <-> the buyer who actually paid.
    const convoRes = await client.query(
      `SELECT id FROM conversations
        WHERE id = $1
          AND listing_id = $2
          AND ((sender_id = $3 AND receiver_id = $4)
            OR (sender_id = $4 AND receiver_id = $3))`,
      [conversationId, listingId, user.id, transaction.buyer_id],
    );
    if (convoRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return Response.json({ error: "Not allowed" }, { status: 403 });
    }

    const already = await client.query(
      `SELECT id FROM login_deliveries WHERE conversation_id = $1 LIMIT 1`,
      [conversationId],
    );
    if (already.rows.length > 0) {
      await client.query("ROLLBACK");
      return Response.json(
        { error: "Login details have already been submitted for this order" },
        { status: 409 },
      );
    }

    const escrowWindowMinutes = Number(await getSetting("escrow_window_minutes")) || 30;
    const expiresAt = new Date(Date.now() + escrowWindowMinutes * 60 * 1000);

    const result = await client.query(
      `INSERT INTO login_deliveries
         (listing_id, conversation_id, seller_id, details, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [listingId, conversationId, user.id, storedDetails, expiresAt],
    );
    const login = result.rows[0];

    const notifMsg = await client.query(
      `INSERT INTO messages (conversation_id, sender_id, message, type, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [
        conversationId,
        SYSTEM_USER_ID,
        `Login details submitted. Buyer now has ${escrowWindowMinutes} minutes to confirm the login details after checking them.`,
        "confirm",
      ],
    );

    await client.query("COMMIT");

    await emitToRoom(`room:${conversationId}`, "new_message", notifMsg.rows[0]);
    await emitToRoom(`room:${conversationId}`, "login_details_ready", {
      conversationId,
      listingId,
    });

    return Response.json({ success: true, data: withDecryptedDetails(login) });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error("LOGIN DETAILS POST ERROR:", err.message);
    return Response.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
