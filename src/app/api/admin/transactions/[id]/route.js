// ROUTE: src/app/api/admin/transactions/[id]/route.js  (NEW)
//
// ADMIN DASHBOARD PHASE 3: full transaction detail, built from every
// table that actually touches one transaction's lifecycle — this is
// the "investigate what happened during a transaction" + "complete
// transaction timeline" requirement. Note there is no completed_at
// column on `transactions` anywhere in the codebase (verified, not
// assumed) — login_deliveries.released_at is used as the closest real
// equivalent ("when did the money actually move"), and the timeline
// below is built from actual timestamped events rather than a single
// invented "completed date" field.
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const txRes = await pool.query(
      `
      SELECT
        t.*,
        l.title AS listing_title, l.price AS listing_price, l.platform AS listing_platform,
        buyer.email AS buyer_email, buyer.first_name AS buyer_first_name, buyer.surname AS buyer_surname,
        seller.email AS seller_email, seller.first_name AS seller_first_name, seller.surname AS seller_surname,
        flagger.email AS flagged_by_email,
        freezer.email AS frozen_by_email
      FROM transactions t
      LEFT JOIN listings l ON l.id = t.listing_id
      LEFT JOIN users buyer ON buyer.id = t.buyer_id
      LEFT JOIN users seller ON seller.id = t.seller_id
      LEFT JOIN users flagger ON flagger.id = t.flagged_by
      LEFT JOIN users freezer ON freezer.id = t.frozen_by
      WHERE t.id = $1
      `,
      [id],
    );

    const transaction = txRes.rows[0];
    if (!transaction) {
      return Response.json({ error: "Transaction not found" }, { status: 404 });
    }

    const deliveryRes = await pool.query(
      `SELECT * FROM login_deliveries WHERE listing_id = $1 ORDER BY created_at DESC`,
      [transaction.listing_id],
    );

    // The full ledger under this transaction's payment_reference — buyer
    // debit, seller credit, platform fee, any dispute refund — all share
    // one reference, same pattern documented in the withdrawal-fee work.
    const ledgerRes = transaction.payment_reference
      ? await pool.query(
          `
          SELECT id, user_id, type, amount, status, description, reference, created_at
          FROM users_transactions
          WHERE reference = $1 OR reference = $2
          ORDER BY created_at ASC
          `,
          [transaction.payment_reference, `refund_${transaction.payment_reference}`],
        )
      : { rows: [] };

    // Build a real timeline from actual timestamped events across the
    // tables above, rather than a single fabricated "completed_at".
    const timeline = [];
    timeline.push({ at: transaction.created_at, label: "Transaction created", detail: `${transaction.transaction_status}, escrow ${transaction.escrow_status}` });
    for (const d of deliveryRes.rows) {
      timeline.push({ at: d.created_at, label: "Login details sent by seller", detail: d.expires_at ? `Buyer had until ${new Date(d.expires_at).toLocaleString()} to confirm` : null });
      if (d.disputed) timeline.push({ at: d.updated_at, label: "Marked as disputed" });
      if (d.confirmed) timeline.push({ at: d.released_at, label: "Buyer confirmed — escrow released" });
      else if (d.released_to_seller) timeline.push({ at: d.released_at, label: "Escrow auto-released (delivery window expired)" });
    }
    if (transaction.frozen) {
      timeline.push({ at: transaction.frozen_at, label: "Frozen by admin", detail: `${transaction.frozen_by_email || ""} ${transaction.frozen_reason ? "— " + transaction.frozen_reason : ""}` });
    }
    for (const l of ledgerRes.rows) {
      timeline.push({ at: l.created_at, label: `Ledger: ${l.description}`, detail: `${l.type} ₦${Number(l.amount).toLocaleString()} — ${l.status}` });
    }
    timeline.sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0));

    return Response.json({
      transaction,
      deliveries: deliveryRes.rows,
      ledger: ledgerRes.rows,
      timeline,
    });
  } catch (err) {
    console.error("ADMIN TRANSACTION DETAIL ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}