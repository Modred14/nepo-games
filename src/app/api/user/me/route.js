import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import pool from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `
      SELECT 
        id,
        email,
        first_name,
        surname,
        username,
        profile_image,
        phone_verified,
        plan,
        subscription_status,
        subscription_start,
        subscription_end,
        payment_provider
      FROM users
      WHERE email = $1
      `,
      [session.user.email],
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const user = result.rows[0];

    const now = Date.now();
    const end = user.subscription_end
      ? new Date(user.subscription_end).getTime()
      : 0;

    const isVerified = user.subscription_status === "active" && end > now;
    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      surname: user.surname,
      username: user.username,
      profileImage: user.profile_image,
      phoneVerified: user.phone_verified,
      plan: user.plan,
      subscriptionStatus: user.subscription_status,
      subscriptionStart:
        user.subscription_start?.toISOString?.() ?? user.subscription_start,
      subscriptionEnd:
        user.subscription_end?.toISOString?.() ?? user.subscription_end,
      paymentProvider: user.payment_provider,
      is_verified: isVerified,
    });
  } catch (err) {
    console.error("GET /api/user/me error:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
