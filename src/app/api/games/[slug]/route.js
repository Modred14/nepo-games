import pool from "../../../../lib/db";
import { getCached, setCached } from "../../../../lib/cache";

export async function GET(req, { params }) {
  try {
    // Cache individual game pages — they rarely change
    const cacheKey = `game:${params.slug}`;
    const cached = await getCached(cacheKey);
    if (cached) return Response.json(cached);

    const result = await pool.query(
      "SELECT * FROM listings WHERE slug = $1",
      [params.slug]
    );

    if (!result.rows[0]) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    await setCached(cacheKey, result.rows[0], 60); // 60s cache
    return Response.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}