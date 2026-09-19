// ROUTE: src/app/api/admin/listings/route.js  (NEW)
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const moderationStatus = searchParams.get("moderationStatus");
    const status = searchParams.get("status");
    const featured = searchParams.get("featured");
    const includeDeleted = searchParams.get("includeDeleted") === "true";
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    const conditions = [];
    const params = [];

    if (!includeDeleted) conditions.push(`l.deleted_at IS NULL`);
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(l.title ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }
    if (moderationStatus) {
      params.push(moderationStatus);
      conditions.push(`l.moderation_status = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`l.status = $${params.length}`);
    }
    if (featured === "true") conditions.push(`l.featured = true`);

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const result = await pool.query(
      `
      SELECT
        l.id, l.title, l.slug, l.price, l.currency, l.platform, l.cover_image,
        l.status, l.moderation_status, l.featured, l.deleted_at, l.created_at,
        u.id AS seller_id, u.email AS seller_email
      FROM listings l
      JOIN users u ON u.id = l.user_id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
      params,
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM listings l JOIN users u ON u.id = l.user_id ${whereClause}`,
      params.slice(0, params.length - 2),
    );

    return Response.json({ listings: result.rows, total: Number(countResult.rows[0]?.total || 0) });
  } catch (err) {
    console.error("ADMIN LISTINGS LIST ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}