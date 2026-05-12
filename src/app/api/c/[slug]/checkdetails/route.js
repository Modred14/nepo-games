import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";
export async function GET(req) {
  try {
    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const listingId = searchParams.get("listingId");

    if (!conversationId || !listingId) {
      return Response.json({ error: "Missing required params" }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT * FROM login_deliveries 
       WHERE listing_id = $1 AND conversation_id = $2
       ORDER BY created_at DESC 
       LIMIT 1`,
      [listingId, conversationId]
    );

    return Response.json({
      exists: result.rows.length > 0,
      data: result.rows[0] ?? null,
    });
  } catch (err) {
    console.error("LOGIN DETAILS GET ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}