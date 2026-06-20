import pool from "../../../../lib/db";
import { resend } from "../../../../lib/resend";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const result = await pool.query(
      "SELECT first_name, username FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const { first_name, username } = result.rows[0];

    await resend.emails.send({
      from: "Nepo Games <no-reply@support.nepogames.com>",
      to: email,
      subject: "You're now a seller on Nepo Games 🎮",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Welcome, Seller!</title>
        </head>
        <body style="margin:0;padding:0;background:#F5F5F4;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
            <tr>
              <td align="center">
                <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E7E5E4;">

                  <!-- Banner -->
                  <tr>
                    <td>
                      <img src="https://res.cloudinary.com/dagot597u/image/upload/v1776988411/welcome_mfzptd.png"
                           alt="Welcome Seller" width="520"
                           style="display:block;border:none;width:100%;max-height:200px;object-fit:cover;" />
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:36px 40px;">

                      <!-- Icon -->
                      <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                        <tr>
                          <td style="width:52px;height:52px;background:#DCFCE7;border-radius:12px;text-align:center;vertical-align:middle;">
                            <img src="https://img.icons8.com/ios/50/16A34A/shop.png" width="26" height="26" alt="" />
                          </td>
                        </tr>
                      </table>

                      <h1 style="margin:0 0 8px;font-size:24px;font-weight:500;color:#0A0A0A;font-family:Georgia,serif;">
                        Congratulations, ${first_name}!
                      </h1>
                      <p style="margin:0 0 28px;font-size:15px;color:#57534E;line-height:1.6;">
                        Your seller account (<strong>@${username}</strong>) is now active on <strong>Nepo Games</strong>.
                        You can start listing your game accounts and reaching buyers right away.
                      </p>

                      <!-- Steps -->
                      <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;border:1px solid #E7E5E4;border-radius:10px;overflow:hidden;">

                        <tr>
                          <td style="padding:16px 20px;border-bottom:1px solid #E7E5E4;">
                            <p style="margin:0 0 2px;font-size:13px;font-weight:600;color:#0A0A0A;">📦 List your first account</p>
                            <p style="margin:0;font-size:13px;color:#78716C;line-height:1.5;">
                              Head to your dashboard and create a listing. Add clear photos, a fair price, and an honest description.
                            </p>
                          </td>
                        </tr>

                        <tr>
                          <td style="padding:16px 20px;border-bottom:1px solid #E7E5E4;">
                            <p style="margin:0 0 2px;font-size:13px;font-weight:600;color:#0A0A0A;">💬 Respond to buyers quickly</p>
                            <p style="margin:0;font-size:13px;color:#78716C;line-height:1.5;">
                              Fast responses build trust and improve your seller rating. Check your messages regularly.
                            </p>
                          </td>
                        </tr>

                        <tr>
                          <td style="padding:16px 20px;">
                            <p style="margin:0 0 2px;font-size:13px;font-weight:600;color:#0A0A0A;">⭐ Build your reputation</p>
                            <p style="margin:0;font-size:13px;color:#78716C;line-height:1.5;">
                              Every successful sale earns you a review. Great ratings mean more visibility and more sales.
                            </p>
                          </td>
                        </tr>

                      </table>

                      <!-- CTA -->
                      <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
                        <tr>
                          <td align="center">
                            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/sell-game"
                               style="display:inline-block;background:#16A34A;color:#ffffff;font-size:15px;font-weight:500;
                                      text-decoration:none;padding:13px 32px;border-radius:8px;">
                              List your first account
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Divider -->
                      <hr style="border:none;border-top:1px solid #E7E5E4;margin:0 0 24px;" />

                      <!-- Support -->
                      <table cellpadding="0" cellspacing="0" style="background:#FAFAF9;border:1px solid #E7E5E4;border-radius:8px;width:100%;">
                        <tr>
                          <td style="padding:14px 16px;font-size:13px;color:#57534E;line-height:1.6;">
                            🛟 Need help? Visit our <a href="${process.env.NEXT_PUBLIC_BASE_URL}/contact" style="color:#1D4ED8;text-decoration:none;">Seller Help Centre</a> or
                            email us at <a href="mailto:support@nepogames.com" style="color:#1D4ED8;text-decoration:none;">support@nepogames.com</a>.
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#FAFAF9;border-top:1px solid #E7E5E4;padding:20px 40px;">
                      <p style="margin:0 0 4px;font-size:12px;color:#78716C;line-height:1.6;">
                        This email was sent to <strong>${email}</strong>.
                        Questions? Contact <a href="mailto:support@nepogames.com" style="color:#78716C;">support@nepogames.com</a>.
                      </p>
                      <p style="margin:8px 0 0;font-size:12px;color:#A8A29E;">
                        © ${new Date().getFullYear()} Nepo Games. All rights reserved.
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
      text: `Congratulations ${first_name}, you're now a seller on Nepo Games!

Your account (@${username}) is active. Here's how to get started:

1. List your first game — ${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/listings/new
2. Respond to buyers quickly to build trust
3. Earn great reviews with every sale

Need help? Email support@nepogames.com`,
    });

    return Response.json(
      { message: "Seller welcome email sent." },
      { status: 200 },
    );
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
