import pool from "../../../lib/db";
import GameClient from "./GameClient";
import { getSimilarGames } from "./getSimilarGames";
import GameNotFound from "./notfound";

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
    `,
    [slug],
  );

  return result.rows[0];
}

export default async function GamePage({ params }) {
  const { slug } = await params;

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
