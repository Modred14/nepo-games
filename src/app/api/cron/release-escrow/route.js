import pool from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();

    // 1. Find expired login deliveries not yet confirmed
    const res = await pool.query(
      `
      SELECT ld.*, t.id as transaction_id, t.seller_id, t.amount
      FROM login_deliveries ld
      JOIN transactions t ON t.id = ld.transaction_id
      WHERE ld.expires_at <= $1
        AND ld.released_to_seller IS NULL
        AND ld.disputed = FALSE
      `,
      [now],
    );

    const expired = res.rows;

    for (const item of expired) {
      // 2. Mark as released
      await pool.query(
        `
        UPDATE login_deliveries
        SET released_to_seller = TRUE,
            released_at = NOW()
        WHERE id = $1
        `,
        [item.id],
      );

      // 3. Credit seller wallet

      await pool.query(
        `
  UPDATE users_transactions
  SET status = 'success',
      type = 'credit',
      description = 'Game account purchase',
      updated_at = NOW()
  WHERE user_id = $1
    AND reference = $2
    AND status = 'pending'
  `,
        [
          item.seller_id,
          item.reference, // MUST exist on login_deliveries or transaction
        ],
      );
      // 4. Update transaction
      await pool.query(
        `
        UPDATE transactions
        SET escrow_status = 'released',
            transaction_status = 'completed'
        WHERE id = $1
        `,
        [item.transaction_id],
      );
    }

    return Response.json({
      released: expired.length,
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "cron failed" }, { status: 500 });
  }
}
