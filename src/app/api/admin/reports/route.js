// ROUTE: src/app/api/admin/reports/route.js  (NEW)
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    const conditions = [];
    const params = [];
    if (status && ["open", "reviewed", "dismissed"].includes(status)) {
      params.push(status);
      conditions.push(`r.status = $${params.length}`);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const result = await pool.query(
      `
      SELECT
        r.id, r.reason, r.status, r.created_at, r.reviewed_at,
        reporter.email AS reporter_email,
        reported.id AS reported_user_id, reported.email AS reported_user_email,
        reported.messaging_restricted,
        l.title AS listing_title,
        reviewer.email AS reviewed_by_email
      FROM reports r
      JOIN users reporter ON reporter.id = r.reporter_id
      JOIN users reported ON reported.id = r.reported_user_id
      LEFT JOIN listings l ON l.id = r.listing_id
      LEFT JOIN users reviewer ON reviewer.id = r.reviewed_by
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
      params,
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM reports r ${whereClause}`,
      params.slice(0, params.length - 2),
    );

    return Response.json({ reports: result.rows, total: Number(countResult.rows[0]?.total || 0) });
  } catch (err) {
    console.error("ADMIN REPORTS LIST ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}