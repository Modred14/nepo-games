// ROUTE: src/app/api/report/route.js  (NEW)
//
// ADMIN DASHBOARD (chat moderation): actual backend for the "Report"
// button on src/app/game/[slug]/GameClient.jsx, which previously only
// set local UI state and never called any API — see
// db/migrations/010_reports_and_messaging_restriction.sql for the full
// context. userId/reportedUserId come from the authenticated session and
// the listing record respectively, never trusted from the client body.
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listingId, reason } = await req.json();

    if (!reason || !reason.trim()) {
      return Response.json({ error: "A reason is required" }, { status: 400 });
    }
    if (!listingId) {
      return Response.json({ error: "listingId is required" }, { status: 400 });
    }

    const listingRes = await pool.query(
      `SELECT user_id FROM listings WHERE id = $1`,
      [listingId],
    );
    const listing = listingRes.rows[0];
    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    if (Number(listing.user_id) === Number(user.id)) {
      return Response.json({ error: "You cannot report your own listing" }, { status: 400 });
    }

    await pool.query(
      `
      INSERT INTO reports (reporter_id, reported_user_id, listing_id, reason)
      VALUES ($1, $2, $3, $4)
      `,
      [user.id, listing.user_id, listingId, reason.trim()],
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error("REPORT SUBMIT ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}