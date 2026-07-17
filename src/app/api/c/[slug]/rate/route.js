// src/app/api/c/[slug]/rate/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req, { params }) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

   
    const { rating, conversationId  } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    const buyerId = user.id;

    const conversation = await pool.query(
      `SELECT * FROM conversations WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2) LIMIT 1`,
      [conversationId, buyerId]
    );

    if (!conversation.rows.length) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const row = conversation.rows[0];

    const sellerId = String(row.sender_id) === String(buyerId)
      ? row.receiver_id
      : row.sender_id;

    const listingId = row.listing_id;

    // FIX (critical): this previously let anyone in a conversation rate the
    // other party, with no check that a transaction ever happened — and a
    // conversation gets created just by messaging a listing, no purchase
    // required. That meant two accounts could message each other and
    // immediately post 5-star (or 1-star) ratings on each other with zero
    // money ever changing hands, making the rating system trivially
    // gameable. Require a transaction between these exact two parties for
    // this listing that actually completed (escrow released) before a
    // rating is allowed.
    const completedTx = await pool.query(
      `SELECT id FROM transactions
       WHERE listing_id = $1
         AND buyer_id = $2
         AND seller_id = $3
         AND escrow_status = 'released'
       LIMIT 1`,
      [listingId, buyerId, sellerId],
    );

    if (completedTx.rows.length === 0) {
      return NextResponse.json(
        { error: "You can only rate a completed transaction" },
        { status: 403 },
      );
    }

    const existing = await pool.query(
      `SELECT id FROM ratings WHERE conversation_id = $1 AND buyer_id = $2 LIMIT 1`,
      [conversationId, buyerId]
    );

    if (existing.rows.length) {
      return NextResponse.json({ error: "Already rated" }, { status: 409 });
    }

    await pool.query(
      `INSERT INTO ratings (conversation_id, listing_id, buyer_id, seller_id, rating, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [conversationId, listingId, buyerId, sellerId, rating]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Rate error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}