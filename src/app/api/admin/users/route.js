// ROUTE: src/app/api/admin/users/route.js  (NEW)
//
// ADMIN DASHBOARD PHASE 2: searchable/filterable/sortable user list.
// created_at is assumed to exist with a DB-level default (it's never
// explicitly set in the signup INSERT in src/app/api/users/route.js,
// which is the standard Postgres pattern for a DEFAULT NOW() column,
// consistent with every other table audited so far) — flagging this
// assumption explicitly since it wasn't directly confirmed in code the
// way every other column referenced here was.
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const SORTABLE_COLUMNS = {
  created_at: "u.created_at",
  email: "u.email",
  username: "u.username",
  last_login_at: "u.last_login_at",
};

export async function GET(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const accountStatus = searchParams.get("accountStatus"); // active|suspended|banned
    const role = searchParams.get("role"); // admin|user
    const sortBy = SORTABLE_COLUMNS[searchParams.get("sortBy")] || "u.created_at";
    const sortDir = searchParams.get("sortDir") === "asc" ? "ASC" : "DESC";
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(u.email ILIKE $${params.length} OR u.username ILIKE $${params.length} OR u.first_name ILIKE $${params.length} OR u.surname ILIKE $${params.length})`,
      );
    }
    if (accountStatus && ["active", "suspended", "banned"].includes(accountStatus)) {
      params.push(accountStatus);
      conditions.push(`u.account_status = $${params.length}`);
    }
    if (role && ["admin", "user"].includes(role)) {
      params.push(role);
      conditions.push(`u.role = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.email,
        u.username,
        u.first_name,
        u.surname,
        u.role,
        u.account_status,
        u.plan,
        u.subscription_status,
        u.is_verified,
        u.phone_verified,
        u.email_verified,
        u.created_at,
        u.last_login_at,
        (SELECT COUNT(*) FROM listings WHERE listings.user_id = u.id) AS listing_count
      FROM users u
      ${whereClause}
      ORDER BY ${sortBy} ${sortDir} NULLS LAST
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
      params,
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM users u ${whereClause}`,
      params.slice(0, params.length - 2),
    );

    return Response.json({
      users: result.rows,
      total: Number(countResult.rows[0]?.total || 0),
    });
  } catch (err) {
    console.error("ADMIN USERS LIST ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}