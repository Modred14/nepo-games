import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get user
 const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


    const userId = user.id;

    // 2. Get ONLY this user's listings
    const listingsResult = await pool.query(
      `
      SELECT 
        l.*,
        u.plan
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.user_id = $1
      AND l.deleted_at IS NULL
      ORDER BY l.created_at DESC
      `,
      [userId],
    );

    const listings = listingsResult.rows;

    // 3. Transform (DON'T send raw DB mess)
    const games = listings.map((item) => ({
      id: item.id,
      title: item.title,
      slug: `/${item.slug}`,
      description: item.description,
      price: `${item.currency} ${item.price}`,
      currency: item.currency,
      views_count: item.views_count || 0,
      proof_image_url: item.proof_image_url || [],
      cover_image: item.cover_image,
      platform: item.platform,
      status: item.status,
      created_at: item.created_at,
      verified: item.plan !== "free",
    }));
    const ratingResult = await pool.query(
      `SELECT ROUND(AVG(rating)::numeric, 1) as average_rating, COUNT(*) as total_ratings
   FROM ratings 
   WHERE seller_id = $1`,
      [userId],
    );

    const averageRating = parseFloat(ratingResult.rows[0]?.average_rating) || 0;
    const totalRatings = parseInt(ratingResult.rows[0]?.total_ratings) || 0;

    return NextResponse.json(
      {
        message: "User listings fetched successfully",
        games,
        total: games.length,
        plan: user.plan,
        averageRating,
        totalRatings,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("GET /api/user/listings error:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
