import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function POST(req) {
  try {
    const { gameId, pin } = await req.json();

    if (!gameId || !pin) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    const user = await requireUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    const userRes = await pool.query(
      `SELECT pin_hash, email FROM users WHERE id = $1`,
      [userId],
    );

    const dbUser = userRes.rows[0];

    if (!dbUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    const isValid = await bcrypt.compare(pin, dbUser.pin_hash);
    if (!isValid) {
      return Response.json({ error: "Incorrect pin" }, { status: 403 });
    }
    const listingRes = await pool.query(
      `SELECT * FROM listings WHERE id = $1`,
      [gameId],
    );

    const listing = listingRes.rows[0];

    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

  
    if (listing.user_id !== userId) {
      return Response.json({ error: "Not your listing" }, { status: 403 });
    }


    if (listing.status === "pending") {
      return Response.json(
        { error: "Cannot delete a pending listing" },
        { status: 400 },
      );
    }

    await pool.query(
      `
      DELETE FROM messages
      WHERE conversation_id IN (
        SELECT id FROM conversations WHERE listing_id = $1
      )
      `,
      [gameId],
    );

    await pool.query(
      `
      DELETE FROM conversation_reads
      WHERE conversation_id IN (
        SELECT id FROM conversations WHERE listing_id = $1
      )
      `,
      [gameId],
    );


    await pool.query(`DELETE FROM conversations WHERE listing_id = $1`, [
      gameId,
    ]);

   
    await pool.query(`DELETE FROM listings WHERE id = $1`, [gameId]);

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE LISTING ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
