import pool from "../../../lib/db";
import { getCached, setCached } from "../../../lib/cache";

export async function GET(req) {
  try {
    const cacheKey = "market:listings";
    const cached = await getCached(cacheKey);
    if (cached)
      return Response.json({
        message: "Listings fetched successfully",
        games: cached,
      });

    const result = await pool.query(`
  SELECT 
    l.*,
    u.plan,
    u.phone_verified
  FROM listings l
  JOIN users u ON l.user_id = u.id
  WHERE l.deleted_at IS NULL
  AND l.status = 'active'
  ORDER BY l.created_at DESC
`);

    const listings = result.rows;

    // Transform into frontend-friendly format
    const games = listings.map((item) => ({
      id: item.id,
      user_id: item.user_id,
      title: item.title,
      slug: `/${item.slug}`,
      description: item.description,
      views_count: item.views_count || 0,
      price: `${item.currency} ${item.price}`,
      currency: item.currency,
      proof_image_url: item.proof_image_url || [],
      cover_image: item.cover_image,
      platform: item.platform,
      status: item.status,
      created_at: item.created_at,
      updated_at: item.updated_at,
      deleted_at: item.deleted_at,
      verified: item.plan !== "free",
    }));

    await setCached(cacheKey, games, 30); // 30 second TTL
    return Response.json({ message: "Listings fetched successfully", games });
  } catch (err) {
    console.error("[GET LISTINGS ERROR]", {
      message: err.message,
      stack: err.stack,
    });

    return Response.json(
      {
        error: "Failed to fetch listings",
        details: err.message,
      },
      { status: 500 },
    );
  }
}
