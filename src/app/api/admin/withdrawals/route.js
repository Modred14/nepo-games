// ROUTE: src/app/api/admin/withdrawals/route.js  (NEW)
//
// Built in response to the original audit's finding that there was no
// admin visibility into withdrawals at all — everything ran fully
// automatically with no way to see pending/unknown/failed rows short of
// querying the database by hand. This lists withdrawal transactions
// (type='debit' AND description='Withdrawal', matching exactly what
// withdraw/route.js inserts) with the user and bank details attached, so
// an admin can actually see what's happening.
//
// Same auth pattern as the existing src/app/api/admin/disputes/route.js —
// requireAdmin() checks session + users.role = 'admin'.
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // 'pending' | 'unknown' | 'success' | 'failed' | null (all)
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    const validStatuses = ["pending", "unknown", "success", "failed"];
    const statusFilter =
      status && validStatuses.includes(status) ? status : null;

    const result = await pool.query(
      `
      SELECT
        t.id,
        t.user_id,
        t.amount,
        t.status,
        t.reference,
        t.created_at,
        u.email        AS user_email,
        TRIM(CONCAT(u.first_name, ' ', u.surname)) AS user_name,
        ub.account_number,
        ub.account_name,
        ub.bank_name,
        ub.bank_code,
        fee.amount     AS fee_amount
      FROM users_transactions t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN LATERAL (
        SELECT account_number, account_name, bank_name, bank_code
        FROM user_banks
        WHERE user_banks.user_id = t.user_id
        ORDER BY created_at DESC
        LIMIT 1
      ) ub ON true
      -- WITHDRAWAL FEE (new): the 'Withdrawal fee' credit row
      -- (user_id=1) inserted alongside this withdrawal in
      -- withdraw/route.js shares its reference column value — join it
      -- here purely for display, so the admin panel can show what was
      -- actually sent to Flutterwave (t.amount - fee.amount) vs. what
      -- was debited from the user's wallet (t.amount).
      LEFT JOIN users_transactions fee
        ON fee.reference = t.reference
        AND fee.type = 'credit'
        AND fee.description = 'Withdrawal fee'
      WHERE t.type = 'debit' AND t.description = 'Withdrawal'
        AND ($1::text IS NULL OR t.status = $1)
      ORDER BY t.created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [statusFilter, limit, offset],
    );

    const countsResult = await pool.query(
      `
      SELECT status, COUNT(*) AS count
      FROM users_transactions
      WHERE type = 'debit' AND description = 'Withdrawal'
      GROUP BY status
      `,
    );

    const counts = Object.fromEntries(
      countsResult.rows.map((r) => [r.status, Number(r.count)]),
    );

    return Response.json({ withdrawals: result.rows, counts });
  } catch (err) {
    console.error("ADMIN WITHDRAWALS LIST ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}