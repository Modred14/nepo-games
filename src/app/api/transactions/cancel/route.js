// ROUTE: src/app/api/transactions/cancel/route.js
//
// Lets a buyer abandon their OWN unpaid card checkout.
// SECURITY: the previous version took `listingId` from the request body and
// set THAT listing back to "active" — so any user holding one cancellable
// transaction could re-activate any other listing, including one mid-escrow
// (enabling a double sale). The listing is now derived from the transaction
// row, and is only released if it is still reserved for this buyer.
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req) {
  const client = await pool.connect();
  try {
    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const transactionId = Number(body?.transactionId);
    if (!Number.isInteger(transactionId) || transactionId <= 0) {
      return Response.json({ error: "Invalid transactionId" }, { status: 400 });
    }

    await client.query("BEGIN");

    const txRes = await client.query(
      `SELECT id, listing_id FROM transactions
        WHERE id = $1
          AND buyer_id = $2
          AND payment_status = 'pending'
          AND transaction_status = 'initiated'
        FOR UPDATE`,
      [transactionId, user.id],
    );
    const tx = txRes.rows[0];

    if (!tx) {
      await client.query("ROLLBACK");
      return Response.json(
        { error: "Transaction not found or not cancellable" },
        { status: 404 },
      );
    }

    await client.query(
      `UPDATE transactions
          SET transaction_status = 'failed', payment_status = 'failed', updated_at = NOW()
        WHERE id = $1`,
      [tx.id],
    );
    // Only release the listing if it is still reserved for THIS buyer.
    await client.query(
      `UPDATE listings SET status = 'active', processing_by = NULL
        WHERE id = $1 AND status = 'processing' AND processing_by = $2`,
      [tx.listing_id, user.id],
    );

    await client.query("COMMIT");
    return Response.json({ success: true });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error("Cancel transaction error:", err.message);
    return Response.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
