// ROUTE: src/app/api/admin/users/[id]/route.js  (NEW)
//
// ADMIN DASHBOARD PHASE 2: full user detail view — profile, listings,
// purchases, sales, wallet transactions, withdrawals, and disputes they've
// been party to. Deliberately does NOT select password_hash, pin_hash,
// verification_token, reset_token, or any other secret/credential column
// — see Section 20 of the original spec ("Never allow the admin
// dashboard to expose... password hashes").
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const userRes = await pool.query(
      `
      SELECT
        id, email, username, first_name, surname, profile_image,
        role, account_status, plan, subscription_status, subscription_start,
        subscription_end, provider, is_verified, phone_verified, email_verified,
        messaging_restricted, created_at, last_login_at
      FROM users
      WHERE id = $1
      `,
      [id],
    );

    const user = userRes.rows[0];
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const [listings, purchases, sales, walletTx, withdrawals, disputes] =
      await Promise.all([
        pool.query(
          `SELECT id, title, slug, price, currency, status, created_at
           FROM listings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
          [id],
        ),
        pool.query(
          `SELECT t.id, t.listing_id, t.seller_id, t.amount, t.escrow_status,
                  t.transaction_status, t.created_at, l.title AS listing_title
           FROM transactions t
           LEFT JOIN listings l ON l.id = t.listing_id
           WHERE t.buyer_id = $1 ORDER BY t.created_at DESC LIMIT 50`,
          [id],
        ),
        pool.query(
          `SELECT t.id, t.listing_id, t.buyer_id, t.amount, t.escrow_status,
                  t.transaction_status, t.created_at, l.title AS listing_title
           FROM transactions t
           LEFT JOIN listings l ON l.id = t.listing_id
           WHERE t.seller_id = $1 ORDER BY t.created_at DESC LIMIT 50`,
          [id],
        ),
        pool.query(
          `SELECT id, type, amount, status, description, reference, created_at
           FROM users_transactions
           WHERE user_id = $1 AND affects_balance = true
           ORDER BY created_at DESC LIMIT 50`,
          [id],
        ),
        pool.query(
          `SELECT id, amount, status, reference, created_at
           FROM users_transactions
           WHERE user_id = $1 AND type = 'debit' AND description = 'Withdrawal'
           ORDER BY created_at DESC LIMIT 50`,
          [id],
        ),
        // Disputes this user has been party to, per the existing
        // login_deliveries.disputed model (see admin/disputes/route.js) —
        // deliberately reusing that model rather than introducing a new
        // disputes table, per the site owner's decision.
        pool.query(
          `SELECT ld.id, ld.transaction_id, ld.disputed, t.buyer_id, t.seller_id,
                  t.escrow_status, t.amount, ld.created_at
           FROM login_deliveries ld
           JOIN transactions t ON t.listing_id = ld.listing_id
           WHERE ld.disputed = true AND (t.buyer_id = $1 OR t.seller_id = $1)
           ORDER BY ld.created_at DESC LIMIT 50`,
          [id],
        ),
      ]);

    return Response.json({
      user,
      listings: listings.rows,
      purchases: purchases.rows,
      sales: sales.rows,
      walletTransactions: walletTx.rows,
      withdrawals: withdrawals.rows,
      disputes: disputes.rows,
    });
  } catch (err) {
    console.error("ADMIN USER DETAIL ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}