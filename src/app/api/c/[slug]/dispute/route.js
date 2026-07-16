import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { emitToRoom } from "@/lib/socket";
import { resend } from "@/lib/resend"; // adjust to your resend import path

const SYSTEM_USER_ID = 1;

export async function POST(req, { params }) {
  const client = await pool.connect();

  try {
    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    await client.query("BEGIN");

    // 1. Get active login delivery (LOCKED) + buyer/seller emails + listing details
    const res = await client.query(
      `
      SELECT 
        ld.*,
        t.id AS transaction_id,
        t.buyer_id,
        t.seller_id,
        t.payment_reference,
        t.escrow_status,
        buyer.email   AS buyer_email,
        buyer.name    AS buyer_name,
        seller.email  AS seller_email,
        seller.name   AS seller_name,
        l.title       AS game_title,
        l.price       AS game_price,
        l.game_type   AS game_type
      FROM login_deliveries ld
      JOIN transactions t       ON t.listing_id = ld.listing_id
      JOIN users buyer          ON buyer.id = t.buyer_id
      JOIN users seller         ON seller.id = t.seller_id
      JOIN listings l           ON l.id = ld.listing_id
      WHERE ld.conversation_id = $1
      ORDER BY ld.created_at DESC
      LIMIT 1
      FOR UPDATE
      `,
      [conversationId],
    );

    const login = res.rows[0];

    if (!login) {
      await client.query("ROLLBACK");
      return Response.json(
        { error: "No active delivery found" },
        { status: 404 },
      );
    }

    const now = new Date();

    if (login.expires_at && new Date(login.expires_at) < now) {
      await client.query("ROLLBACK");
      return Response.json(
        { error: "Delivery expired. Contact support." },
        { status: 403 },
      );
    }

    if (Number(login.buyer_id) !== Number(user.id)) {
      await client.query("ROLLBACK");
      return Response.json({ error: "Not allowed" }, { status: 403 });
    }

    if (login.disputed === true) {
      await client.query("ROLLBACK");
      return Response.json({ error: "Already disputed" }, { status: 409 });
    }

    if (login.escrow_status === "released") {
      await client.query("ROLLBACK");
      return Response.json(
        { error: "Cannot dispute a released transaction" },
        { status: 409 },
      );
    }

    // 2. Mark as disputed
    await client.query(
      `UPDATE login_deliveries
       SET disputed = TRUE, updated_at = NOW()
       WHERE id = $1 AND disputed = FALSE`,
      [login.id],
    );

    // 3. Freeze escrow
    await client.query(
      `UPDATE transactions
       SET escrow_status = 'frozen',
           transaction_status = 'disputed',
           updated_at = NOW()
       WHERE id = $1`,
      [login.transaction_id],
    );

    // 4. System message
    const systemMsg = await client.query(
      `INSERT INTO messages
         (conversation_id, sender_id, message, type, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [
        conversationId,
        SYSTEM_USER_ID,
        "Buyer raised a dispute. Escrow has been frozen.",
        "dispute",
      ],
    );

    // 5. Freeze seller transaction
    await client.query(
      `UPDATE users_transactions
       SET status = 'frozen', updated_at = NOW()
       WHERE user_id = $1
         AND reference = $2
         AND status = 'pending'`,
      [login.seller_id, login.payment_reference],
    );

    await client.query("COMMIT");

    // FIX: everything from here on happens AFTER the dispute has already
    // been committed to the DB — escrow is frozen and the dispute is real
    // regardless of what happens next. Previously, if the socket emit or
    // the admin alert email threw (e.g. Resend having an outage), execution
    // fell into the outer catch block, which tried to ROLLBACK an
    // already-committed transaction (a no-op) and then told the buyer
    // "Server error" even though their dispute had genuinely gone through.
    // That's confusing for the buyer and generates duplicate support
    // tickets when they retry and get "Already disputed." Wrapping this in
    // its own try/catch means a notification hiccup can never turn a
    // successful dispute into a false failure response.
    try {
      // 6. Emit to socket server
      await emitToRoom(
        `room:${conversationId}`,
        "new_message",
        systemMsg.rows[0],
      );
      await emitToRoom(`user:${login.buyer_id}`, "sidebar_update", {});
      await emitToRoom(`user:${login.seller_id}`, "sidebar_update", {});
    } catch (notifyErr) {
      console.error("DISPUTE: socket emit failed (dispute still recorded):", notifyErr);
    }

    // 7. Send admin dispute alert email
    try {
      await resend.emails.send({
      from: "Nepogames <no-reply@support.nepogames.com>",
      to: "favourdomirin@gmail.com",
      subject: `⚠️ Dispute Raised — ${login.game_title} (Ref: ${login.payment_reference})`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Dispute Alert</title>
        </head>
        <body style="margin:0;padding:0;background:#F5F5F4;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
            <tr>
              <td align="center">
                <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E7E5E4;">

                  <!-- Header -->
                  <tr>
                    <td style="background:#0A0A0A;padding:24px 40px;">
                      <span style="font-family:Georgia,serif;font-size:20px;color:#ffffff;font-weight:400;letter-spacing:-0.3px;">
                        Nepogames<span style="color:#60A5FA;">.</span>
                      </span>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:36px 40px;">

                      <!-- Icon + title -->
                      <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                        <tr>
                          <td style="width:52px;height:52px;background:#FEF2F2;border-radius:12px;text-align:center;vertical-align:middle;">
                            <img src="https://img.icons8.com/ios/50/E53E3E/warning-shield.png" width="26" height="26" alt="" />
                          </td>
                        </tr>
                      </table>

                      <h1 style="margin:0 0 6px;font-size:24px;font-weight:500;color:#0A0A0A;font-family:Georgia,serif;">
                        Dispute raised
                      </h1>
                      <p style="margin:0 0 28px;font-size:15px;color:#57534E;line-height:1.6;">
                        A buyer has opened a dispute on a transaction. Escrow has been frozen
                        and the transaction is now pending your review.
                      </p>

                      <!-- Game details card -->
                      <p style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#78716C;">
                        Game details
                      </p>
                      <table cellpadding="0" cellspacing="0" style="width:100%;background:#F8FAFF;border:1px solid #BFDBFE;border-radius:10px;margin-bottom:24px;">
                        <tr>
                          <td style="padding:20px 24px;">
                            <p style="margin:0 0 4px;font-size:20px;font-weight:500;color:#0A0A0A;font-family:Georgia,serif;">
                              ${login.game_title}
                            </p>
                            <p style="margin:0 0 12px;font-size:13px;color:#57534E;">
                              ${login.game_type ?? "—"}
                            </p>
                            <table cellpadding="0" cellspacing="0" style="width:100%;">
                              <tr>
                                <td style="font-size:13px;color:#78716C;padding:3px 0;">Amount</td>
                                <td style="font-size:13px;color:#0A0A0A;font-weight:500;text-align:right;padding:3px 0;">
                                  ₦${Number(login.game_price).toLocaleString()}
                                </td>
                              </tr>
                              <tr>
                                <td style="font-size:13px;color:#78716C;padding:3px 0;">Payment ref</td>
                                <td style="font-size:13px;color:#0A0A0A;font-weight:500;text-align:right;padding:3px 0;font-family:monospace;">
                                  ${login.payment_reference}
                                </td>
                              </tr>
                              <tr>
                                <td style="font-size:13px;color:#78716C;padding:3px 0;">Conversation</td>
                                <td style="font-size:13px;color:#0A0A0A;font-weight:500;text-align:right;padding:3px 0;font-family:monospace;">
                                  #${conversationId}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Parties -->
                      <p style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#78716C;">
                        Parties involved
                      </p>
                      <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
                        <tr>
                          <td style="width:50%;padding-right:8px;vertical-align:top;">
                            <table cellpadding="0" cellspacing="0" style="width:100%;background:#FAFAF9;border:1px solid #E7E5E4;border-radius:10px;">
                              <tr>
                                <td style="padding:16px 18px;">
                                  <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#78716C;">Buyer</p>
                                  <p style="margin:0 0 4px;font-size:15px;font-weight:500;color:#0A0A0A;">${login.buyer_name}</p>
                                  <p style="margin:0;font-size:13px;color:#1D4ED8;">${login.buyer_email}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td style="width:50%;padding-left:8px;vertical-align:top;">
                            <table cellpadding="0" cellspacing="0" style="width:100%;background:#FAFAF9;border:1px solid #E7E5E4;border-radius:10px;">
                              <tr>
                                <td style="padding:16px 18px;">
                                  <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#78716C;">Seller</p>
                                  <p style="margin:0 0 4px;font-size:15px;font-weight:500;color:#0A0A0A;">${login.seller_name}</p>
                                  <p style="margin:0;font-size:13px;color:#1D4ED8;">${login.seller_email}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Status badge -->
                      <table cellpadding="0" cellspacing="0" style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;width:100%;">
                        <tr>
                          <td style="padding:12px 14px;font-size:13px;color:#B91C1C;line-height:1.5;">
                            🔒 Escrow is <strong>frozen</strong>. Transaction status set to <strong>disputed</strong>.
                            No funds will be released until you resolve this case.
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#FAFAF9;border-top:1px solid #E7E5E4;padding:20px 40px;">
                      <p style="margin:0 0 4px;font-size:12px;color:#78716C;line-height:1.6;">
                        This is an automated alert from the Nepogames dispute system.
                      </p>
                      <p style="margin:8px 0 0;font-size:12px;color:#A8A29E;">
                        © ${new Date().getFullYear()} Nepogames. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      });
    } catch (emailErr) {
      console.error("DISPUTE: admin alert email failed (dispute still recorded):", emailErr);
    }

    return Response.json({ success: true });
  } catch (err) {
    // At this point the dispute transaction itself has NOT committed yet
    // (a commit failure would have to happen before the try/catch blocks
    // above, which only wrap post-commit side effects), so a rollback here
    // is always safe and correct.
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      // transaction may already be closed — ignore
    }
    console.error("DISPUTE ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }
}