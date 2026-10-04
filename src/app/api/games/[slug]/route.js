// ROUTE: src/app/api/games/[slug]/route.js
// SECURITY: this returned `SELECT * FROM listings` for ANY slug — including
// deleted, unapproved, pending and sold listings, with every internal column.
// It now only serves listings that are publicly visible, with explicit columns.
// (`params` is also awaited: it is a Promise in current Next.js.)
import pool from "../../../../lib/db";
import { getCached, setCached } from "../../../../lib/cache";

export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    if (typeof slug !== "string" || slug.length > 200) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    const cacheKey = `game:${slug}`;
    const cached = await getCached(cacheKey);
    if (cached) return Response.json(cached);

    const result = await pool.query(
      `SELECT id, user_id, title, slug, description, price, currency, platform,
              cover_image, proof_image_url, views_count, created_at
         FROM listings
        WHERE slug = $1
          AND status = 'active'
          AND moderation_status = 'approved'
          AND deleted_at IS NULL`,
      [slug],
    );
    if (!result.rows[0]) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    await setCached(cacheKey, result.rows[0], 60);
    return Response.json(result.rows[0]);
  } catch (err) {
    console.error("GET /api/games/[slug] error:", err.message);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
