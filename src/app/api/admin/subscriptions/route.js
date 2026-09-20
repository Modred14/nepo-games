// ROUTE: src/app/api/admin/subscriptions/route.js  (NEW)
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const plan = searchParams.get("plan");
    const search = (searchParams.get("search") || "").trim();
    const expiringOnly = searchParams.get("expiringOnly") === "true";
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    const conditions = [`plan IS NOT NULL AND plan != 'free'`];
    const params = [];

    if (plan) {
      params.push(plan);
      conditions.push(`plan = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(email ILIKE $${params.length} OR username ILIKE $${params.length})`);
    }
    if (expiringOnly) {
      conditions.push(`subscription_end BETWEEN NOW() AND NOW() + INTERVAL '7 days'`);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const result = await pool.query(
      `
      SELECT id, email, username, first_name, surname, plan, subscription_status,
             subscription_start, subscription_end
      FROM users
      ${whereClause}
      ORDER BY subscription_end ASC NULLS LAST
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
      params,
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM users ${whereClause}`,
      params.slice(0, params.length - 2),
    );

    return Response.json({ subscribers: result.rows, total: Number(countResult.rows[0]?.total || 0) });
  } catch (err) {
    console.error("ADMIN SUBSCRIPTIONS LIST ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}