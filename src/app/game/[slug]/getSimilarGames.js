import pool from "../../../../lib/db";

export async function getSimilarGames(currentGame) {
  const priceRange = 0.2; // ±20% range

  // 1. Try similar price
  const minPrice = currentGame.price * (1 - priceRange);
  const maxPrice = currentGame.price * (1 + priceRange);

  let result = await pool.query(
    `
    SELECT listings.*, users.username, users.profile_image, users.is_verified
    FROM listings
    JOIN users ON listings.user_id = users.id
    WHERE listings.id != $1
    AND listings.price BETWEEN $2 AND $3
    ORDER BY RANDOM()
    LIMIT 2
    `,
    [currentGame.id, minPrice, maxPrice]
  );

  // 2. If not enough → fallback to verified sellers
  if (result.rows.length < 2) {
    result = await pool.query(
      `
      SELECT listings.*, users.username, users.profile_image, users.is_verified
      FROM listings
      JOIN users ON listings.user_id = users.id
      WHERE listings.id != $1
      AND users.is_verified = true
      ORDER BY RANDOM()
      LIMIT 2
      `,
      [currentGame.id]
    );
  }

  // 3. If still not enough → fallback to anything
  if (result.rows.length < 2) {
    result = await pool.query(
      `
      SELECT listings.*, users.username, users.profile_image, users.is_verified
      FROM listings
      JOIN users ON listings.user_id = users.id
      WHERE listings.id != $1
      ORDER BY RANDOM()
      LIMIT 2
      `,
      [currentGame.id]
    );
  }

  return result.rows;
}