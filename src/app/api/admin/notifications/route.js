// ROUTE: src/app/api/admin/notifications/route.js  (NEW)
//
// ADMIN DASHBOARD: notification center. Deliberately built as a LIVE,
// read-only aggregation over tables that already exist and are already
// correctly maintained by earlier phases — not a stored event log. That
// means:
//   - No new migration, no new write path into any table that matters.
//   - Nothing here can ever drift from reality or need "marking as
//     read" — an item disappears the moment the underlying thing is
//     actually resolved (e.g. once a withdrawal moves out of 'unknown',
//     it's just gone from this feed, not archived somewhere).
//   - Can't introduce a new bug in a money-moving flow, because it only
//     ever SELECTs.
//
// Each category links straight to the already-built, already-filtered
// admin page for it — this is a front door, not a new destination.
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      unknownWithdrawals,
      openDisputes,
      flaggedTransactions,
      frozenTransactions,
      recentFailedWithdrawals,
      expiringSubscriptions,
    ] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS count FROM users_transactions
         WHERE type = 'debit' AND description = 'Withdrawal' AND status = 'unknown'`,
      ),
      pool.query(
        `SELECT COUNT(*) AS count FROM login_deliveries WHERE disputed = true`,
      ),
      pool.query(
        `SELECT COUNT(*) AS count FROM transactions WHERE flagged_for_review = true`,
      ),
      pool.query(
        `SELECT COUNT(*) AS count FROM transactions WHERE frozen = true`,
      ),
      pool.query(
        `SELECT COUNT(*) AS count FROM users_transactions
         WHERE type = 'debit' AND description = 'Withdrawal' AND status = 'failed'
           AND created_at >= NOW() - INTERVAL '24 hours'`,
      ),
      pool.query(
        `SELECT COUNT(*) AS count FROM users
         WHERE subscription_end BETWEEN NOW() AND NOW() + INTERVAL '3 days'`,
      ),
    ]);

    const items = [
      {
        key: "unknown_withdrawals",
        count: Number(unknownWithdrawals.rows[0].count),
        severity: "high",
        label: "Withdrawal(s) need reconciliation",
        description: "Couldn't be confirmed against Flutterwave automatically.",
        href: "/admin/withdrawals?status=unknown",
      },
      {
        key: "open_disputes",
        count: Number(openDisputes.rows[0].count),
        severity: "high",
        label: "Open dispute(s)",
        description: "Escrow is frozen pending your resolution.",
        href: "/admin/disputes",
      },
      {
        key: "flagged_transactions",
        count: Number(flaggedTransactions.rows[0].count),
        severity: "medium",
        label: "Transaction(s) flagged for review",
        description: "An admin marked these for a closer look.",
        href: "/admin/transactions?flagged=true",
      },
      {
        key: "frozen_transactions",
        count: Number(frozenTransactions.rows[0].count),
        severity: "medium",
        label: "Transaction(s) still frozen",
        description: "Blocked from auto-release and buyer confirmation until unfrozen.",
        href: "/admin/transactions?frozen=true",
      },
      {
        key: "recent_failed_withdrawals",
        count: Number(recentFailedWithdrawals.rows[0].count),
        severity: "medium",
        label: "Withdrawal(s) failed in the last 24h",
        description: "Worth a look if this number is climbing.",
        href: "/admin/withdrawals?status=failed",
      },
      {
        key: "expiring_subscriptions",
        count: Number(expiringSubscriptions.rows[0].count),
        severity: "low",
        label: "Subscription(s) expiring within 3 days",
        description: "Informational — no action needed.",
        href: "/admin/subscriptions?expiringOnly=true",
      },
    ].filter((item) => item.count > 0);

    const totalUrgent = items
      .filter((i) => i.severity === "high" || i.severity === "medium")
      .reduce((sum, i) => sum + i.count, 0);

    return Response.json({ items, totalUrgent });
  } catch (err) {
    console.error("ADMIN NOTIFICATIONS ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}