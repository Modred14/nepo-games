// ROUTE: src/app/sitemap.js
import pool from "../lib/db";

// Rebuilt at most hourly; never prerendered at build time (no DB needed to build).
export const revalidate = 3600;
export const dynamic = "force-dynamic";

const baseUrl = "https://nepogames.com";

export default async function sitemap() {
  // Only PUBLIC, indexable pages. Auth pages, dashboards, chats, payment pages
  // and admin are deliberately excluded (and also disallowed in robots.js).
  const now = new Date();
  const pages = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/marketplace`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/tournament`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/pricing`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/terms-of-service`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy-policy`, changeFrequency: "yearly", priority: 0.3 },
  ].map((p) => ({ ...p, lastModified: now }));

  let listings = [];
  try {
    const res = await pool.query(
      `SELECT slug, COALESCE(updated_at, created_at) AS modified
         FROM listings
        WHERE status = 'active'
          AND moderation_status = 'approved'
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 5000`,
    );
    listings = res.rows.map((r) => ({
      url: `${baseUrl}/game/${r.slug}`,
      lastModified: r.modified ? new Date(r.modified) : now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch (err) {
    console.error("sitemap: could not load listings:", err.message);
  }

  return [...pages, ...listings];
}
