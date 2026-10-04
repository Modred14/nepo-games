// ROUTE: src/app/api/c/[slug]/checkdetails/route.js
//
// CRITICAL FIX (credential disclosure / IDOR): this endpoint used to return
// `SELECT * FROM login_deliveries` — including the game-account login
// credentials in `details` — to ANY logged-in user who supplied a
// conversationId + listingId. It never checked that the caller took part in
// the conversation. Anyone could enumerate small integer ids and harvest
// other people's purchased credentials.
//
// Now the caller must be one of the two participants of that conversation,
// and the conversation must belong to the listing being asked about.
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { withDecryptedDetails } from "@/lib/secretBox";

export async function GET(req) {
  try {
    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = Number(searchParams.get("conversationId"));
    const listingId = Number(searchParams.get("listingId"));

    if (
      !Number.isInteger(conversationId) ||
      conversationId <= 0 ||
      !Number.isInteger(listingId) ||
      listingId <= 0
    ) {
      return Response.json({ error: "Missing required params" }, { status: 400 });
    }

    const convo = await pool.query(
      `SELECT id FROM conversations
        WHERE id = $1
          AND listing_id = $2
          AND (sender_id = $3 OR receiver_id = $3)`,
      [conversationId, listingId, user.id],
    );
    if (convo.rows.length === 0) {
      return Response.json({ error: "Not allowed" }, { status: 403 });
    }

    const result = await pool.query(
      `SELECT * FROM login_deliveries
        WHERE listing_id = $1 AND conversation_id = $2
        ORDER BY created_at DESC
        LIMIT 1`,
      [listingId, conversationId],
    );

    return Response.json({
      exists: result.rows.length > 0,
      data: withDecryptedDetails(result.rows[0] ?? null),
    });
  } catch (err) {
    console.error("LOGIN DETAILS GET ERROR:", err.message);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
