// ROUTE: src/app/api/admin/subscriptions/[userId]/cancel/route.js  (NEW)
//
// Immediately expires a subscription — sets subscription_end to now,
// which (via derivePlanFromDays(0) = 'free') is the same "free" state a
// naturally-expired subscription reaches. Consistent with how
// subscription_status is otherwise a derived value in this codebase
// (see the charge.failed handler in webhook/route.js, which recomputes
// it from subscription_end vs NOW() the same way).
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminAudit";

export async function POST(req, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await params;
    const { reason } = await req.json();

    const existing = await pool.query(
      `SELECT plan, subscription_end FROM users WHERE id = $1`,
      [userId],
    );
    if (!existing.rows[0]) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await pool.query(
      `
      UPDATE users
      SET plan = 'free', subscription_status = 'inactive', subscription_end = NOW()
      WHERE id = $1
      RETURNING id, plan, subscription_status, subscription_end
      `,
      [userId],
    );

    logAdminAction({
      admin,
      action: "subscription.cancel",
      resourceType: "user",
      resourceId: userId,
      previousValue: { plan: existing.rows[0].plan, subscription_end: existing.rows[0].subscription_end },
      newValue: { plan: "free", subscription_end: updated.rows[0].subscription_end },
      reason: reason || null,
      req,
    });

    return Response.json({ user: updated.rows[0] });
  } catch (err) {
    console.error("ADMIN SUBSCRIPTION CANCEL ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}