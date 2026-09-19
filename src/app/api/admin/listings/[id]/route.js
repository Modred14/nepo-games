// ROUTE: src/app/api/admin/listings/[id]/route.js  (NEW)
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const res = await pool.query(
      `
      SELECT
        l.*,
        u.email AS seller_email, u.first_name AS seller_first_name, u.surname AS seller_surname,
        mod.email AS moderated_by_email
      FROM listings l
      JOIN users u ON u.id = l.user_id
      LEFT JOIN users mod ON mod.id = l.moderated_by
      WHERE l.id = $1
      `,
      [id],
    );

    const listing = res.rows[0];
    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    const salesRes = await pool.query(
      `SELECT id, amount, transaction_status, escrow_status, created_at
       FROM transactions WHERE listing_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [id],
    );

    return Response.json({ listing, sales: salesRes.rows });
  } catch (err) {
    console.error("ADMIN LISTING DETAIL ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}