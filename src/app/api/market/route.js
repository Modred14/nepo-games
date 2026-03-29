import pool from "../../../../lib/db";

export async function GET(req) {
  try {
    console.log("[STEP 1] Fetching listings");

    const result = await pool.query(
      `
      SELECT *
      FROM listings
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      `
    );

    const listings = result.rows;

    console.log("[STEP 2] Raw listings fetched:", listings.length);

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
      verified: item.status === "Active",
    }));

    console.log("[STEP 3] Transformed games ready");

    return Response.json(
      {
        message: "Listings fetched successfully",
        games,
      },
      { status: 200 }
    );
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
      { status: 500 }
    );
  }
}