import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req, { params }) {
  try {
    const user = await requireUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      console.error("❌ Missing conversationId in params");
      return Response.json(
        { error: "Missing conversationId" },
        { status: 400 },
      );
    }

    const body = await req.json();

    const { listingId, details } = body;
    if (!listingId) {
      console.error("❌ Missing listingId in request body");
    }

    if (!details) {
      console.error("❌ Missing details in request body");
    }

    if (!listingId || !details) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 🔥 IMPORTANT FIX: no transaction.id nonsense
    const result = await pool.query(
      `
      INSERT INTO login_deliveries
      (listing_id, conversation_id, seller_id, details, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
      `,
      [listingId, conversationId, user.id, details],
    );

    return Response.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error("LOGIN DETAILS POST ERROR:", err);

    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
