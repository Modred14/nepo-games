// ROUTE: src/app/api/admin/subscriptions/[userId]/route.js  (NEW)
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await params;

    const userRes = await pool.query(
      `SELECT id, email, username, first_name, surname, plan, subscription_status,
              subscription_start, subscription_end
       FROM users WHERE id = $1`,
      [userId],
    );
    const user = userRes.rows[0];
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // `payments` is specifically the subscription-payment record (see
    // PLAN_BY_AMOUNT in src/app/api/paystack/webhook/route.js) — distinct
    // from `transactions` (marketplace purchases) and `users_transactions`
    // (wallet ledger).
    const paymentsRes = await pool.query(
      `SELECT id, amount, reference, status, created_at
       FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
      [userId],
    );

    return Response.json({ user, payments: paymentsRes.rows });
  } catch (err) {
    console.error("ADMIN SUBSCRIPTION DETAIL ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
