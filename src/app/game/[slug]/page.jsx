import pool from "../../../../lib/db";
import GameClient from "./GameClient";
import { getSimilarGames } from "./getSimilarGames";

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
      users.is_verified
    FROM listings
    JOIN users ON listings.user_id = users.id
    WHERE listings.slug = $1
    `,
    [slug],
  );

  return result.rows[0];
}

export default async function GamePage({ params }) {
  const { slug } = await params;

  const game = await getGame(slug);

  if (!game) return <div>Game not found</div>;
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
