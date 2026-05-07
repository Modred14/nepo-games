import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listingId, receiverId, paymentMethod } = await req.json();

    const listingRes = await pool.query(
      "SELECT * FROM listings WHERE id = $1",
      [listingId],
    );

    const listing = listingRes.rows[0];

    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.status !== "active") {
      return Response.json({ error: "Listing not available" }, { status: 400 });
    }

    // const existing = await pool.query(
    //   `SELECT * FROM transactions
    //    WHERE listing_id = $1
    //    AND buyer_id = $2
    //    AND payment_status IN ('pending','paid')`,
    //   [listingId, user.id],
    // );

    // if (existing.rows.length > 0) {
    //   return Response.json(
    //     { error: "Transaction already exists" },
    //     { status: 400 },
    //   );
    // }

    const amount = Number(listing.price);
    if (paymentMethod === "wallet") {
      // 1. Check user balance
      const balanceResult = await pool.query(
        `
  SELECT 
    COALESCE(SUM(
      CASE 
        WHEN type = 'credit' THEN amount
        WHEN type = 'debit' THEN -amount
      END
    ), 0) AS balance
  FROM users_transactions
  WHERE user_id = $1 AND status = 'success'
  `,
        [user.id],
      );

      const balance = Number(balanceResult.rows[0].balance);

      if (balance < amount) {
        return Response.json(
          { error: "Insufficient balance" },
          { status: 400 },
        );
      }

      const txRes = await pool.query(
        `INSERT INTO transactions 
    (buyer_id, seller_id, listing_id, amount, payment_method, payment_status, transaction_status, escrow_status, created_at)
    VALUES ($1, $2, $3, $4, 'wallet', 'paid', 'completed', 'holding', NOW())
    RETURNING *`,
        [user.id, listing.user_id, listing.id, amount],
      );

      const reference = `wallet_tx_${Date.now()}_${user.id}`;
      const transaction = txRes.rows[0];

      await pool.query("UPDATE listings SET status = 'pending' WHERE id = $1", [
        listingId,
      ]);

      await pool.query(
        `UPDATE transactions
       SET payment_reference = $1
       WHERE id = $2`,
        [reference, transaction.id],
      );
      await pool.query(
        `
      INSERT INTO users_transactions
      (user_id, type, amount, status, description, reference)
      VALUES ($1, 'debit', $2, 'success', 'Game account purchase', $3)
      `,
        [user.id, amount, reference],
      );
      await pool.query(
        `
      INSERT INTO users_transactions
      (user_id, type, amount, status, description, reference)
      VALUES ($1, 'credit', $2, 'pending', 'Game account purchase', $3)
      `,
        [listing.user_id, amount, reference],
      );

      return Response.json({ success: true });
    }
    if (paymentMethod === "paystack") {
      const txRes = await pool.query(
        `INSERT INTO transactions 
  (buyer_id, seller_id, listing_id, amount, payment_method, payment_status, transaction_status, escrow_status, created_at)
  VALUES ($1, $2, $3, $4, $5, 'pending', 'initiated', 'holding', NOW())
  RETURNING *`,
        [user.id, listing.user_id, listing.id, amount, "paystack"],
      );

      const transaction = txRes.rows[0];

      // 4. Call Paystack
      const paystackRes = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            amount: amount * 100, // kobo
            reference: `tx_${transaction.id}_${Date.now()}`,
            callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/c/${listing.id}?receiver_id=${receiverId}&payment=success`,
            metadata: {
              userId: user.id,
              purpose: "marketplace",
              transaction_id: transaction.id,
              listing_id: listing.id,
              receiverId,
            },
          }),
        },
      );

      const paystackData = await paystackRes.json();

      if (!paystackData.status) {
        return Response.json({ error: "Payment init failed" }, { status: 500 });
      }

      // 5. Save reference
      await pool.query(
        `UPDATE transactions
       SET payment_reference = $1
       WHERE id = $2`,
        [paystackData.data.reference, transaction.id],
      );
     

      return Response.json({
        authorization_url: paystackData.data.authorization_url,
      });
    }
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
