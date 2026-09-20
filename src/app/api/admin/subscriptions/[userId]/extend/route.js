// ROUTE: src/app/api/admin/subscriptions/[userId]/extend/route.js  (NEW)
//
// ADMIN DASHBOARD PHASE 5: grants/extends subscription time. Follows the
// EXACT same rollover + tier-derivation logic as a real payment in
// src/app/api/paystack/webhook/route.js (roll remaining time forward,
// then derive the plan tier from TOTAL days remaining via
// derivePlanFromDays — see src/lib/subscriptions.js) so an admin grant
// can never disagree with what the next real payment would compute.
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminAudit";
import { derivePlanFromDays } from "@/lib/subscriptions";

export async function POST(req, { params }) {
  const client = await pool.connect();
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await params;
    const { days, reason } = await req.json();

    const numDays = Number(days);
    if (!Number.isInteger(numDays) || numDays === 0) {
      return Response.json({ error: "days must be a non-zero whole number" }, { status: 400 });
    }

    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT plan, subscription_end FROM users WHERE id = $1 FOR UPDATE`,
      [userId],
    );
    if (!existing.rows[0]) {
      await client.query("ROLLBACK");
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const currentEnd = existing.rows[0].subscription_end;
    const startFrom = currentEnd && new Date(currentEnd) > now ? new Date(currentEnd) : now;
    const end = new Date(startFrom);
    end.setDate(end.getDate() + numDays);

    const totalDaysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    const finalPlan = derivePlanFromDays(totalDaysRemaining);

    const updated = await client.query(
      `
      UPDATE users
      SET plan = $1,
          subscription_status = $2,
          subscription_start = COALESCE(subscription_start, NOW()),
          subscription_end = $3
      WHERE id = $4
      RETURNING id, plan, subscription_status, subscription_end
      `,
      [finalPlan, finalPlan === "free" ? "inactive" : "active", end, userId],
    );

    await client.query("COMMIT");

    logAdminAction({
      admin,
      action: numDays > 0 ? "subscription.extend" : "subscription.reduce",
      resourceType: "user",
      resourceId: userId,
      previousValue: { plan: existing.rows[0].plan, subscription_end: existing.rows[0].subscription_end },
      newValue: { plan: finalPlan, subscription_end: end, daysGranted: numDays },
      reason: reason || null,
      req,
    });

    return Response.json({ user: updated.rows[0] });
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("ADMIN SUBSCRIPTION EXTEND ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
}