// ROUTE: src/app/game/[slug]/page.jsx
// ADMIN DASHBOARD PHASE 4 FOLLOW-UP: this is the real public listing
// page — src/app/api/games/[slug]/route.js looks similar but turned out
// to be unused dead code (verified via a full-codebase search for any
// caller; this page does its own direct DB query instead). It was
// missing the moderation_status/deleted_at filter that
// src/app/api/market/route.js and paystack/buy/initialize/route.js
// already got in the listing-moderation work — a hidden/rejected/
// deleted listing was still fully viewable at its direct URL even
// though it couldn't be found via search or bought. Purchase was never
// actually at risk (buy/initialize/route.js already blocks it), but the
// page itself should 404 the same way it already does for a genuinely
// nonexistent slug.
import pool from "../../../lib/db";
import GameClient from "./GameClient";
import { getSimilarGames } from "./getSimilarGames";
import GameNotFound from "./notfound";
import { getSetting } from "../../../lib/settings";


async function getGame(slug) {
  const result = await pool.query(
    `
    SELECT 
      listings.*,
      users.id AS seller_id,
      users.first_name,
      users.surname,
      users.username,
      users.email,
      users.profile_image,
      users.plan,
      users.phone_verified,  
      COALESCE(r.average_rating, 0) AS average_rating,
      COALESCE(r.rating_count, 0)   AS rating_count
    FROM listings
    JOIN users ON listings.user_id = users.id
    LEFT JOIN (
      SELECT 
        seller_id,
        ROUND(AVG(rating)::numeric, 1) AS average_rating,
        COUNT(*)                        AS rating_count
      FROM ratings
      GROUP BY seller_id
    ) r ON r.seller_id = users.id
    WHERE listings.slug = $1
    AND listings.status = 'active'
    AND listings.moderation_status = 'approved'
    AND listings.deleted_at IS NULL
    `,
    [slug],
  );

  return result.rows[0];
}
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const game = await getGame(slug);

  if (!game) {
    return {
      title: "Listing Not Found",
      description: "This game account listing could not be found.",
    };
  }

  const images = Array.isArray(game.proof_image_url)
    ? game.proof_image_url.map((url) => url.replace(/^"+|"+$/g, "").trim())
    : typeof game.proof_image_url === "string"
      ? game.proof_image_url
          .replace(/[{}]/g, "")
          .split(",")
          .map((url) => url.replace(/^"+|"+$/g, "").trim())
      : [];

  const ogImage = images[0] || "/og-image.png";
  const price = Number(game.price).toLocaleString();
  const title = `${game.title} Account — ₦${price}`;
  const description = `Buy ${game.title} account on ${game.platform} for ₦${price}. Sold by ${game.username}. Secure payment with escrow protection on Nepogames.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://nepogames.com/game/${slug}`,
      siteName: "Nepogames",
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: `https://nepogames.com/game/${slug}`,
    },
  };
}
export default async function GamePage({ params }) {
  const { slug } = await params;

  // ADMIN DASHBOARD (general settings): distinct from "not found" —
  // showing GameNotFound during maintenance would be misleading (the
  // listing exists, the marketplace just isn't serving it right now).
  const maintenanceMode = await getSetting("maintenance_mode");
  if (maintenanceMode) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Temporarily under maintenance</h1>
        <p style={{ color: "#64748b", marginTop: 8 }}>
          We're making some improvements. Please check back shortly.
        </p>
      </div>
    );
  }

  const game = await getGame(slug);

  if (!game)
    return (
      <div>
        <GameNotFound />
      </div>
    );
  const similarGames = await getSimilarGames(game);

  const images = Array.isArray(game.proof_image_url)
    ? game.proof_image_url.map((url) => url.replace(/^"+|"+$/g, "").trim())
    : typeof game.proof_image_url === "string"
      ? game.proof_image_url
          .replace(/[{}]/g, "")
          .split(",")
          .map((url) => url.replace(/^"+|"+$/g, "").trim())
      : [];

  return <GameClient similarGames={similarGames} game={game} images={images} />;
}