// src/app/api/admin/disputes/route.js
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// FIX (critical): there was previously no way to see, let alone resolve,
// open disputes — dispute/route.js only froze escrow and sent an email
// alert. This lists every currently-frozen/disputed transaction so an
// admin can act on it via POST /api/admin/disputes/resolve.
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await pool.query(
      `SELECT
         ld.id            AS delivery_id,
         ld.conversation_id,
         ld.created_at    AS delivered_at,
         t.id              AS transaction_id,
         t.amount,
         t.payment_reference,
         t.payment_method,
         t.escrow_status,
         t.transaction_status,
         buyer.id          AS buyer_id,
         buyer.email       AS buyer_email,
         buyer.name        AS buyer_name,
         seller.id         AS seller_id,
         seller.email      AS seller_email,
         seller.name       AS seller_name,
         l.title           AS game_title
       FROM login_deliveries ld
       JOIN transactions t  ON t.listing_id = ld.listing_id
       JOIN users buyer     ON buyer.id = t.buyer_id
       JOIN users seller    ON seller.id = t.seller_id
       JOIN listings l      ON l.id = ld.listing_id
       WHERE ld.disputed = TRUE
         AND t.escrow_status = 'frozen'
       ORDER BY ld.updated_at DESC NULLS LAST, ld.created_at DESC`,
    );

    return Response.json({ disputes: result.rows });
  } catch (err) {
    console.error("ADMIN DISPUTES LIST ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}