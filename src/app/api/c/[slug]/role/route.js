import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getCached, setCached } from "@/lib/cache";

/**
 * GET /api/listings/[slug]/role
 *
 * BEFORE: getServerSession() + getUserByEmail() + listing query = 2 DB hits
 * AFTER:  requireUser() from JWT (0 DB) + cached listing owner (near-0 DB)
 */
export async function GET(req, { params }) {
  try {
    const { slug: listing_id } = await params;

    const currentUser = await requireUser(); // ✅ Zero DB — reads from JWT

    if (!currentUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const current_user_id = Number(currentUser.id);

    // ─────────────────────────────────────────────────────────────────────────
    // Cache the listing's seller_id — it never changes after posting
    // ─────────────────────────────────────────────────────────────────────────
    const listingKey = `listing:${listing_id}:seller`;
    let seller_id = await getCached(listingKey);

    if (!seller_id) {
      const listingRes = await pool.query(
        `SELECT user_id FROM listings WHERE id = $1 LIMIT 1`,
        [listing_id],
      );

      if (listingRes.rows.length === 0) {
        return Response.json({ error: "Listing not found" }, { status: 404 });
      }

      seller_id = Number(listingRes.rows[0].user_id);
      // Cache for 1 hour — listing ownership never changes
      await setCached(listingKey, seller_id, 60 * 60);
    }

    const isSeller = current_user_id === seller_id;
    const role = isSeller ? "seller" : "buyer";
    const otherRole = isSeller ? "buyer" : "seller";

    return Response.json({
      listing_id,
      seller_id,
      buyer_id: isSeller ? null : current_user_id,
      current_user_id,
      role,
      otherRole,
      isSeller,
    });
  } catch (err) {
    console.error("ROLE API ERROR:", err);
    return Response.json(
      { error: "Server error", details: err.message },
      { status: 500 },
    );
  }
}
