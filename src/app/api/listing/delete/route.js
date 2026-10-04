// ROUTE: src/app/api/listing/delete/route.js
// src/app/api/listing/delete/route.js
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";
import bcrypt from "bcrypt";
import { checkRateLimit, tooManyRequests } from "@/lib/rateLimit";

export async function POST(req) {
  const client = await pool.connect();

  try {
    const body = await req.json().catch(() => ({}));
    const gameId = Number(body.gameId);
    const pin = typeof body.pin === "string" ? body.pin : "";

    if (!Number.isInteger(gameId) || gameId <= 0 || !/^\d{4}$/.test(pin)) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    const rl = await checkRateLimit(`delete-listing:${userId}`, { limit: 10, windowSeconds: 900, failClosed: true });
    if (!rl.allowed) return tooManyRequests();

    // ✅ Fetch pin_hash from DB — intentional, can't store this in JWT
    const userRes = await pool.query(
      `SELECT pin_hash, email FROM users WHERE id = $1`,
      [userId]
    );

    const dbUser = userRes.rows[0];
    if (!dbUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // FIX: bcrypt.compare throws when the stored hash is null/undefined
    // (users who never set a withdrawal/delete PIN). Handle that case with
    // a clear message instead of falling through to a generic 500 error.
    if (!dbUser.pin_hash) {
      return Response.json(
        { error: "You haven't set a PIN yet. Please set one first." },
        { status: 400 },
      );
    }

    const isValid = await bcrypt.compare(pin, dbUser.pin_hash);
    if (!isValid) {
      return Response.json({ error: "Incorrect pin" }, { status: 403 });
    }

    // ✅ Fetch listing to verify ownership
    const listingRes = await pool.query(
      `SELECT * FROM listings WHERE id = $1`,
      [gameId]
    );

    const listing = listingRes.rows[0];
    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    // ✅ Fixed: Number() on both sides to prevent type mismatch
    if (Number(listing.user_id) !== Number(userId)) {
      return Response.json({ error: "Not your listing" }, { status: 403 });
    }

    // A listing with ANY live order (paid, awaiting delivery/confirmation, or
    // disputed) must never be deleted — that would erase the chat/evidence
    // while money is in escrow.
    const liveTx = await pool.query(
      `SELECT 1 FROM transactions
        WHERE listing_id = $1
          AND (payment_status = 'pending'
               OR escrow_status IN ('holding', 'frozen'))
        LIMIT 1`,
      [gameId],
    );
    if (liveTx.rows.length > 0) {
      return Response.json(
        { error: "Cannot delete a listing with an order in progress" },
        { status: 400 },
      );
    }

    if (listing.status === "pending") {
      return Response.json(
        { error: "Cannot delete a pending listing" },
        { status: 400 }
      );
    }

    // FIX: a listing with status "processing" is currently locked to a buyer
    // who is mid-checkout (e.g. on the Paystack payment page). Deleting it
    // out from under them would orphan that in-flight transaction.
    if (listing.status === "processing") {
      return Response.json(
        { error: "Cannot delete a listing that is currently being purchased" },
        { status: 400 }
      );
    }

    // ✅ All deletes inside a transaction — if one fails, all roll back
    await client.query("BEGIN");

    await client.query(
      `DELETE FROM messages
       WHERE conversation_id IN (
         SELECT id FROM conversations WHERE listing_id = $1
       )`,
      [gameId]
    );

    await client.query(
      `DELETE FROM conversation_reads
       WHERE conversation_id IN (
         SELECT id FROM conversations WHERE listing_id = $1
       )`,
      [gameId]
    );

    await client.query(
      `DELETE FROM conversations WHERE listing_id = $1`,
      [gameId]
    );

    await client.query(
      `DELETE FROM listings WHERE id = $1`,
      [gameId]
    );

    await client.query("COMMIT");

    return Response.json({ success: true });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error("DELETE LISTING ERROR:", err.message);
    return Response.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
}