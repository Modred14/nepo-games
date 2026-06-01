import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactionId, listingId } = await req.json();
const txRes = await pool.query(
      `SELECT * FROM transactions 
       WHERE id = $1 AND buyer_id = $2 
       AND payment_status = 'pending' 
       AND transaction_status = 'initiated'`,
      [transactionId, user.id],
    );

    if (!txRes.rows[0]) {
      return Response.json(
        { error: "Transaction not found or not cancellable" },
        { status: 404 },
      );
    }
   await pool.query(
      `UPDATE listings SET status = 'active', processing_by = NULL WHERE id = $1`,
      [listingId],
    );

    await pool.query(
      `UPDATE transactions 
   SET transaction_status = 'failed', payment_status = 'failed'
   WHERE id = $1`,
      [transactionId],
    );
   // Verify the transaction belongs to this user and is still pending
    

    // Reset listing back to active
  
    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
