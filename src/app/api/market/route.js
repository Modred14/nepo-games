// ROUTE: src/app/api/market/route.js
// ADMIN DASHBOARD PHASE 4: also excludes listings an admin has hidden or
// rejected (moderation_status) — see db/migrations/007_listing_moderation.sql.
// ADMIN DASHBOARD (general settings): checks maintenance_mode/
// marketplace_enabled BEFORE the cache lookup — otherwise flipping
// either off from /admin/settings wouldn't take effect until the
// existing 30s cache entry expired, which defeats the point of an
// emergency "shut off the marketplace" switch.
import pool from "../../../lib/db";
import { getCached, setCached } from "../../../lib/cache";
import { getSetting } from "../../../lib/settings";

export async function GET(req) {
  try {
    const [maintenanceMode, marketplaceEnabled] = await Promise.all([
      getSetting("maintenance_mode"),
      getSetting("marketplace_enabled"),
    ]);

    if (maintenanceMode || !marketplaceEnabled) {
      return Response.json({
        message: maintenanceMode
          ? "The marketplace is temporarily down for maintenance."
          : "The marketplace is currently unavailable.",
        games: [],
        marketplaceUnavailable: true,
      });
    }

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
  AND l.moderation_status = 'approved'
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