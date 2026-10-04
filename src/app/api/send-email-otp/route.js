// ROUTE: src/app/api/send-email-otp/route.js
import crypto from "crypto";
import pool from "../../../lib/db";
import { requireUser } from "../../../lib/auth";
import { escapeHtml } from "../../../lib/html";
import { checkRateLimit, tooManyRequests } from "../../../lib/rateLimit";
import { resend } from "../../../lib/resend";

// SECURITY: crypto.randomInt instead of Math.random (predictable PRNG).
function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function POST(req) {
  try {
    // SECURITY: this endpoint was fully unauthenticated and mailed a code to
    // ANY address supplied in the body (spam / email-bombing relay under our
    // domain). It now requires a login and only ever mails the logged-in
    // user's own address; the `email` field in the body is ignored.
    const sessionUser = await requireUser();
    if (!sessionUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(`email-otp-send:${sessionUser.id}`, {
      limit: 5,
      windowSeconds: 3600,
      failClosed: true,
    });
    if (!rl.allowed) return tooManyRequests();

    const found = await pool.query("SELECT id, email FROM users WHERE id = $1", [sessionUser.id]);
    if (found.rows.length === 0) {
      return Response.json({ error: "No account found." }, { status: 404 });
    }
    const email = found.rows[0].email;

    const otp = generateOTP();
    const expires = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

    // Stored hashed: a DB read must not reveal live codes. The attempt
    // counter is reset on every new code.
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    await pool.query(
      "UPDATE users SET phone_verification_code = $1, verification_expires = $2, otp_attempts = 0 WHERE id = $3",
      [`email:${otpHash}`, expires, sessionUser.id]
    );

    await resend.emails.send({
      from: "Nepogames <no-reply@support.nepogames.com>",
      to: email,
      subject: "Your Nepogames OTP Code",
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
                        This email was sent to <strong>${escapeHtml(email)}</strong>.
                        Questions? Contact <a href="mailto:support@nepogames.com" style="color:#78716C;">support@nepogames.com</a>.
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
      text: `Your Nepogames OTP is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
    });

    return Response.json({ message: "OTP sent successfully" }, { status: 200 });

  } catch (err) {
    console.error("Send email OTP error:", err.message);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}