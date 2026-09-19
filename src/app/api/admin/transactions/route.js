// ROUTE: src/app/api/admin/transactions/route.js  (NEW)
//
// ADMIN DASHBOARD PHASE 3: transaction/escrow investigation list. Shows
// EVERY transaction, not just disputed ones — the existing
// /api/admin/disputes route only surfaces transactions currently under
// an open dispute, which is correct for that page but too narrow for
// general "investigate what happened here" tooling.
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // transaction_status
    const escrowStatus = searchParams.get("escrowStatus");
    const flagged = searchParams.get("flagged"); // "true" to filter to flagged only
    const frozen = searchParams.get("frozen");
    const search = (searchParams.get("search") || "").trim(); // buyer/seller email or listing title
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`t.transaction_status = $${params.length}`);
    }
    if (escrowStatus) {
      params.push(escrowStatus);
      conditions.push(`t.escrow_status = $${params.length}`);
    }
    if (flagged === "true") {
      conditions.push(`t.flagged_for_review = true`);
    }
    if (frozen === "true") {
      conditions.push(`t.frozen = true`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(buyer.email ILIKE $${params.length} OR seller.email ILIKE $${params.length} OR l.title ILIKE $${params.length})`,
      );
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const result = await pool.query(
      `
      SELECT
        t.id, t.amount, t.payment_method, t.payment_status, t.transaction_status,
        t.escrow_status, t.payment_reference, t.created_at,
        t.flagged_for_review, t.frozen,
        l.title AS listing_title,
        buyer.id AS buyer_id, buyer.email AS buyer_email,
        seller.id AS seller_id, seller.email AS seller_email,
        ld.disputed
      FROM transactions t
      LEFT JOIN listings l ON l.id = t.listing_id
      LEFT JOIN users buyer ON buyer.id = t.buyer_id
      LEFT JOIN users seller ON seller.id = t.seller_id
      LEFT JOIN LATERAL (
        SELECT disputed FROM login_deliveries
        WHERE login_deliveries.listing_id = t.listing_id
        ORDER BY created_at DESC LIMIT 1
      ) ld ON true
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
      params,
    );

    const countResult = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM transactions t
      LEFT JOIN listings l ON l.id = t.listing_id
      LEFT JOIN users buyer ON buyer.id = t.buyer_id
      LEFT JOIN users seller ON seller.id = t.seller_id
      ${whereClause}
      `,
      params.slice(0, params.length - 2),
    );

    return Response.json({
      transactions: result.rows,
      total: Number(countResult.rows[0]?.total || 0),
    });
  } catch (err) {
    console.error("ADMIN TRANSACTIONS LIST ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}