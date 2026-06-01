import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

/**
 * GET /api/user/me
 *
 * BEFORE: getServerSession() + getUserByEmail() = 1 DB query every call
 * AFTER:  requireUser() reads from JWT = ZERO DB queries
 *
 * If you update the user's profile (e.g. they change their username),
 * call `update(newData)` from useSession() on the frontend to refresh the token.
 */
export async function GET() {
  try {
    const user = await requireUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // user already has all fields from the JWT — no DB call needed
    return NextResponse.json(user);
  } catch (err) {
    console.error("GET /api/user/me error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
