import pool from "../../../lib/db";
import { resend } from "../../../lib/resend";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await pool.query("SELECT id FROM users WHERE email = $1", [email]);

    if (user.rows.length === 0) {
      return Response.json({ error: "No account found with this email." }, { status: 404 });
    }

    const otp = generateOTP();
    const expires = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

    await pool.query(
      "UPDATE users SET phone_verification_code = $1, verification_expires = $2 WHERE email = $3",
      [otp, expires, email]
    );

    await resend.emails.send({
      from: "Nepo Games <no-reply@support.nepogames.com>",
      to: email,
      subject: "Your Nepo Games OTP Code",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Your OTP Code</title>
        </head>
        <body style="margin:0;padding:0;background:#F5F5F4;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
            <tr>
              <td align="center">
                <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E7E5E4;">

                  <tr>
                    <td style="padding:36px 40px;">

                      <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                        <tr>
                          <td style="width:52px;height:52px;background:#DBEAFE;border-radius:12px;text-align:center;vertical-align:middle;">
                            <img src="https://img.icons8.com/ios/50/1D4ED8/lock-2.png" width="26" height="26" alt="" />
                          </td>
                        </tr>
                      </table>

                      <h1 style="margin:0 0 8px;font-size:24px;font-weight:500;color:#0A0A0A;font-family:Georgia,serif;">
                        Your one-time code
                      </h1>
                      <p style="margin:0 0 28px;font-size:15px;color:#57534E;line-height:1.6;">
                        Use the code below to continue. Do not share it with anyone.
                      </p>

                      <!-- OTP Box -->
                      <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
                        <tr>
                          <td align="center">
                            <div style="display:inline-block;background:#F0F9FF;border:1px solid #BFDBFE;
                                        border-radius:12px;padding:20px 48px;">
                              <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#1D4ED8;font-family:monospace;">
                                ${otp}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <!-- Expiry notice -->
                      <table cellpadding="0" cellspacing="0" style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;width:100%;">
                        <tr>
                          <td style="padding:12px 14px;font-size:13px;color:#9A3412;line-height:1.5;">
                            ⏱ This code expires in <strong>10 minutes</strong>. If you didn't request this,
                            you can safely ignore this email.
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
      text: `Your Nepo Games OTP is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
    });

    return Response.json({ message: "OTP sent successfully" }, { status: 200 });

  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}