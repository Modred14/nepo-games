// ROUTE: src/app/api/c/[slug]/role/route.js
// src/app/api/c/[slug]/role/route.js
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getCached, setCached } from "@/lib/cache";
import { maskEmail } from "@/lib/html";

/**
 * GET /api/listings/[slug]/role
 *
 * BEFORE: getServerSession() + getUserByEmail() + listing query = 2 DB hits
 * AFTER:  requireUser() from JWT (0 DB) + cached listing owner (near-0 DB)
 */
export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    const listing_id = Number(slug);
    if (!Number.isInteger(listing_id) || listing_id <= 0) {
      return Response.json({ error: "Invalid listing" }, { status: 400 });
    }

    const currentUser = await requireUser(); // ✅ Zero DB — reads from JWT

    if (!currentUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const current_user_id = Number(currentUser.id);

    const { searchParams } = new URL(req.url);
    const receiverIdParam = searchParams.get("receiver_id");

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
     const otherId = isSeller
      ? receiverIdParam
        ? Number(receiverIdParam)
        : null
      : seller_id;

    // The "other side" of a trade chat can only be a participant of an actual
    // conversation on this listing — otherwise this endpoint would be a
    // user-lookup oracle for any user id.
    if (otherId !== null) {
      if (!Number.isInteger(otherId) || otherId <= 0) {
        return Response.json({ error: "Invalid receiver" }, { status: 400 });
      }
      if (isSeller) {
        const part = await pool.query(
          `SELECT 1 FROM conversations
            WHERE listing_id = $1
              AND ((sender_id = $2 AND receiver_id = $3) OR (sender_id = $3 AND receiver_id = $2))
            LIMIT 1`,
          [listing_id, current_user_id, otherId],
        );
        if (part.rows.length === 0) {
          return Response.json({ error: "Not allowed" }, { status: 403 });
        }
      }
    }

    const [otherUserRes, listingRes] = await Promise.all([
      otherId
        ? pool.query(
            `SELECT id, username, email, profile_image, plan FROM users WHERE id = $1 LIMIT 1`,
            [otherId],
          )
        : Promise.resolve({ rows: [] }),
      pool.query(
        `SELECT
           price,
           status,
           processing_by,
           COALESCE(title || ' (' || COALESCE(platform, '') || ')', title, 'Unknown Game') AS gamedetails
         FROM listings WHERE id = $1 LIMIT 1`,
        [listing_id],
      ),
    ]);

    const otherUserRow = otherUserRes.rows[0] || null;
    const otherUser = otherUserRow ? { ...otherUserRow, email: maskEmail(otherUserRow.email) } : null;
    const listingInfo = listingRes.rows[0] || null;

    return Response.json({
      listing_id,
      seller_id,
      buyer_id: isSeller ? null : current_user_id,
      current_user_id,
      role,
      otherRole,
      isSeller,
      otherUser,
      listing: listingInfo,
    });
  } catch (err) {
    console.error("ROLE API ERROR:", err.message);
    return Response.json(
      { error: "Server error" },
      { status: 500 },
    );
  }
}