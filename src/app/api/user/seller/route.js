import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import pool from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 1. Get user
    const userResult = await pool.query(
      "SELECT id, plan FROM users WHERE email = $1",
      [session.user.email]
    );

    const user = userResult.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

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
      [userId]
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

    return NextResponse.json(
      {
        message: "User listings fetched successfully",
        games,
        total: games.length,
        plan: user.plan,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/user/listings error:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}