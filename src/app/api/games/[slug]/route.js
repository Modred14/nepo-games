import pool from "../../../../lib/db";

export async function GET(req, { params }) {
  const result = await pool.query("SELECT * FROM listings WHERE slug = $1", [
    params.slug,
  ]);

  return Response.json(result.rows[0]);
}
