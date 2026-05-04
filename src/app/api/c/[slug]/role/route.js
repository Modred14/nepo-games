import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { getUserByEmail } from "@/lib/userService";

export async function GET(req, { params }) {
  try {
       const { slug: listing_id } = await params

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await getUserByEmail(session.user.email);

    if (!currentUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // -------------------------
    // 2. GET LISTING OWNER (SELLER)
    // -------------------------
    const listingRes = await pool.query(
      `SELECT user_id FROM listings WHERE id = $1 LIMIT 1`,
      [listing_id]
    );

    if (listingRes.rows.length === 0) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    const seller_id = Number(listingRes.rows[0].user_id);
    const current_user_id = Number(currentUser.id);

    // -------------------------
    // 3. ROLE LOGIC
    // -------------------------
    const isSeller = current_user_id === seller_id;

    const role = isSeller ? "seller" : "buyer";

    // optional: define opposite role
    const otherRole = isSeller ? "buyer" : "seller";

    // -------------------------
    // 4. RESPONSE
    // -------------------------
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
      {
        error: "Server error",
        details: err.message,
      },
      { status: 500 }
    );
  }
}