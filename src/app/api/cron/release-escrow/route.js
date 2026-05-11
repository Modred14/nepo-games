import pool from "@/lib/db";

const SYSTEM_USER_ID = 1;

export async function GET() {
    const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const client = await pool.connect();

  try {
    const now = new Date();

    // 1. Find expired login deliveries that were never confirmed and never released
    //    Checking BOTH confirmed = FALSE and released_to_seller IS NULL
    //    prevents double-release if buyer already confirmed manually
    const res = await client.query(
      `
      SELECT 
        ld.*,
        t.id AS transaction_id,
        t.seller_id,
        t.buyer_id,
        t.payment_reference,
        t.amount
      FROM login_deliveries ld
      JOIN transactions t ON t.listing_id = ld.listing_id
      WHERE ld.expires_at <= $1
        AND ld.confirmed = FALSE
        AND ld.released_to_seller IS NULL
        AND ld.disputed = FALSE
      `,
      [now],
    );

    const expired = res.rows;
    let released = 0;

    for (const item of expired) {
      try {
        await client.query("BEGIN");

        // 2. Re-fetch and lock the row inside the transaction
        //    to avoid race conditions with the manual confirm
        const locked = await client.query(
          `
          SELECT ld.*, t.id AS transaction_id, t.seller_id, t.payment_reference
          FROM login_deliveries ld
          JOIN transactions t ON t.listing_id = ld.listing_id
          WHERE ld.id = $1
            AND ld.confirmed = FALSE
            AND ld.released_to_seller IS NULL
            AND ld.disputed = FALSE
          FOR UPDATE
          `,
          [item.id],
        );

        // If the row was confirmed or released between our scan and this lock, skip it
        if (locked.rows.length === 0) {
          await client.query("ROLLBACK");
          continue;
        }

        const login = locked.rows[0];

        // 3. Mark delivery as released (mirrors confirmed = TRUE from manual confirm)
        await client.query(
          `
          UPDATE login_deliveries
          SET released_to_seller = TRUE,
              released_at = NOW(),
              updated_at = NOW()
          WHERE id = $1
          `,
          [login.id],
        );

        // 4. Release escrow — mirrors manual confirm exactly
        await client.query(
          `
          UPDATE transactions
          SET escrow_status = 'released',
              transaction_status = 'completed',
              updated_at = NOW()
          WHERE id = $1
          `,
          [login.transaction_id],
        );

        // 5. Credit seller — same query as manual confirm
        await client.query(
          `
          UPDATE users_transactions
          SET status = 'success',
              updated_at = NOW()
          WHERE user_id = $1
            AND reference = $2
            AND status = 'pending'
          `,
          [login.seller_id, login.payment_reference],
        );

        // 6. System message — mirrors manual confirm
        await client.query(
          `
          INSERT INTO messages
            (conversation_id, sender_id, message, type, created_at)
          VALUES
            ($1, $2, $3, $4, NOW())
          `,
          [
            item.conversation_id,
            SYSTEM_USER_ID,
            "Delivery window expired. Money has been automatically released to seller.",
            "confirm",
          ],
        );

        await client.query("COMMIT");
        released++;
      } catch (itemErr) {
        await client.query("ROLLBACK");
        console.error(`CRON RELEASE ERROR for delivery ${item.id}:`, itemErr);
        // Continue to next item — one failure shouldn't block the rest
      }
    }

    return Response.json({ released });
  } catch (err) {
    console.error("CRON FATAL ERROR:", err);
    return Response.json({ error: "cron failed" }, { status: 500 });
  } finally {
    client.release();
  }
}