// ROUTE: src/app/api/admin/dashboard/route.js  (NEW)
//
// ADMIN DASHBOARD PHASE 2: overview metrics. Two kinds of numbers here,
// and the response labels which is which:
//   - RANGE metrics (new users, transactions, revenue, withdrawals):
//     computed within the requested date window (?range=today|7d|30d|90d|
//     year|custom, with ?start=&end= for custom).
//   - POINT-IN-TIME metrics (current escrow held, current subscriber
//     counts, currently suspended users): always "right now", regardless
//     of the date filter — a date range doesn't really mean anything for
//     "how much money is in escrow right now".
//
// Two things worth knowing when reading this file:
//   1. "Active users" = logged in within the last 30 days, using
//      last_login_at (see db/migrations/004_...). This is a fixed
//      30-day window, independent of the range filter — shown as its
//      own metric with the definition spelled out, not folded into
//      the range-based numbers.
//   2. escrow_status in the transactions table has BOTH 'held' and
//      'holding' as values in actual use (found via audit, not assumed)
//      — likely an inconsistency from a prior refactor. Both are treated
//      as "money currently in escrow" here so the number is accurate
//      either way, but this inconsistency is worth a look outside the
//      scope of this dashboard.
//   3. "Reported listings" is not tracked anywhere in the current schema
//      (no reports/flags table) — omitted rather than faked. Same for a
//      "sold" listing status, which doesn't exist; the real statuses in
//      use are 'active' / 'pending' / 'processing'.
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function resolveRange(searchParams) {
  const range = searchParams.get("range") || "30d";
  const now = new Date();
  let start;

  switch (range) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "7d":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case "custom": {
      const s = searchParams.get("start");
      const e = searchParams.get("end");
      return {
        range,
        start: s ? new Date(s) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: e ? new Date(e) : now,
      };
    }
    case "30d":
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  return { range, start, end: now };
}

export async function GET(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const { range, start, end } = resolveRange(searchParams);

    const [
      userCounts,
      newUsersToday,
      newUsersRange,
      activeUsers30d,
      listingCounts,
      txCounts,
      escrowHeld,
      revenueRange,
      withdrawalCounts,
      withdrawalTotalRange,
      planCounts,
      subscriptionRevenueRange,
      expiringSubscriptions,
    ] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE account_status = 'suspended') AS suspended,
          COUNT(*) FILTER (WHERE account_status = 'banned') AS banned,
          COUNT(*) FILTER (WHERE is_verified = true) AS verified,
          COUNT(*) FILTER (WHERE id IN (SELECT DISTINCT user_id FROM listings)) AS sellers,
          COUNT(*) FILTER (WHERE id IN (SELECT DISTINCT buyer_id FROM transactions)) AS buyers
        FROM users
      `),
      pool.query(
        `SELECT COUNT(*) AS count FROM users WHERE created_at >= $1`,
        [new Date(new Date().setHours(0, 0, 0, 0))],
      ),
      pool.query(`SELECT COUNT(*) AS count FROM users WHERE created_at BETWEEN $1 AND $2`, [
        start,
        end,
      ]),
      pool.query(
        `SELECT COUNT(*) AS count FROM users WHERE last_login_at >= NOW() - INTERVAL '30 days'`,
      ),
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'active') AS active,
          COUNT(*) FILTER (WHERE status = 'pending') AS pending,
          COUNT(*) FILTER (WHERE status = 'processing') AS processing
        FROM listings
      `),
      pool.query(
        `
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE transaction_status = 'completed') AS completed,
          COUNT(*) FILTER (WHERE transaction_status = 'pending') AS pending,
          COUNT(*) FILTER (WHERE transaction_status = 'failed') AS failed,
          COUNT(*) FILTER (WHERE transaction_status = 'disputed') AS disputed,
          COUNT(*) FILTER (WHERE transaction_status = 'refunded') AS refunded,
          COUNT(*) FILTER (WHERE transaction_status = 'cancelled') AS cancelled
        FROM transactions
        WHERE created_at BETWEEN $1 AND $2
        `,
        [start, end],
      ),
      // Point-in-time: money currently sitting in escrow, regardless of
      // when the transaction was created.
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE escrow_status IN ('held', 'holding', 'frozen')`,
      ),
      pool.query(
        `
        SELECT
          COALESCE(SUM(amount) FILTER (WHERE description = 'Platform fee' AND status = 'success'), 0) AS platform_fees,
          COALESCE(SUM(amount) FILTER (WHERE description = 'Withdrawal fee' AND status = 'success'), 0) AS withdrawal_fees
        FROM users_transactions
        WHERE type = 'credit' AND created_at BETWEEN $1 AND $2
        `,
        [start, end],
      ),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'pending') AS pending,
          COUNT(*) FILTER (WHERE status = 'unknown') AS unknown,
          COUNT(*) FILTER (WHERE status = 'success') AS success,
          COUNT(*) FILTER (WHERE status = 'failed') AS failed
        FROM users_transactions
        WHERE type = 'debit' AND description = 'Withdrawal'
      `),
      pool.query(
        `
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM users_transactions
        WHERE type = 'debit' AND description = 'Withdrawal' AND status = 'success'
          AND created_at BETWEEN $1 AND $2
        `,
        [start, end],
      ),
      // Point-in-time: who's on which plan right now.
      pool.query(`
        SELECT plan, COUNT(*) AS count
        FROM users
        WHERE plan IS NOT NULL
        GROUP BY plan
      `),
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'success' AND created_at BETWEEN $1 AND $2`,
        [start, end],
      ),
      pool.query(
        `SELECT COUNT(*) AS count FROM users WHERE subscription_end BETWEEN NOW() AND NOW() + INTERVAL '7 days'`,
      ),
    ]);

    return Response.json({
      range: { key: range, start, end },
      users: {
        total: Number(userCounts.rows[0].total),
        newToday: Number(newUsersToday.rows[0].count),
        newInRange: Number(newUsersRange.rows[0].count),
        active30d: Number(activeUsers30d.rows[0].count),
        activeDefinition: "Logged in within the last 30 days",
        suspended: Number(userCounts.rows[0].suspended),
        banned: Number(userCounts.rows[0].banned),
        verified: Number(userCounts.rows[0].verified),
        sellers: Number(userCounts.rows[0].sellers),
        buyers: Number(userCounts.rows[0].buyers),
      },
      listings: {
        total: Number(listingCounts.rows[0].total),
        active: Number(listingCounts.rows[0].active),
        pending: Number(listingCounts.rows[0].pending),
        processing: Number(listingCounts.rows[0].processing),
      },
      transactions: {
        totalInRange: Number(txCounts.rows[0].total),
        completed: Number(txCounts.rows[0].completed),
        pending: Number(txCounts.rows[0].pending),
        failed: Number(txCounts.rows[0].failed),
        disputed: Number(txCounts.rows[0].disputed),
        refunded: Number(txCounts.rows[0].refunded),
        cancelled: Number(txCounts.rows[0].cancelled),
        escrowHeldNow: Number(escrowHeld.rows[0].total),
      },
      revenue: {
        platformFeesInRange: Number(revenueRange.rows[0].platform_fees),
        withdrawalFeesInRange: Number(revenueRange.rows[0].withdrawal_fees),
        subscriptionRevenueInRange: Number(subscriptionRevenueRange.rows[0].total),
      },
      withdrawals: {
        pending: Number(withdrawalCounts.rows[0].pending),
        unknown: Number(withdrawalCounts.rows[0].unknown),
        success: Number(withdrawalCounts.rows[0].success),
        failed: Number(withdrawalCounts.rows[0].failed),
        totalWithdrawnInRange: Number(withdrawalTotalRange.rows[0].total),
      },
      subscriptions: {
        byPlan: Object.fromEntries(
          planCounts.rows.map((r) => [r.plan, Number(r.count)]),
        ),
        expiringWithin7Days: Number(expiringSubscriptions.rows[0].count),
      },
    });
  } catch (err) {
    console.error("ADMIN DASHBOARD ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}