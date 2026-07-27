// ROUTE: src/app/api/user/me/route.js
// CHANGED: added `dynamic = "force-dynamic"` and a Cache-Control header.
// Without this, this GET route could be served from a cached response
// (browser or edge), so right after a subscription upgrade — where
// /api/paystack/verify reissues the session cookie with the new plan — the
// pricing page could still show the OLD plan until the cache expired,
// even though the cookie itself was already correct.
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

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
    return NextResponse.json(user, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("GET /api/user/me error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}