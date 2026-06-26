import { NextResponse } from "next/server";
import crypto from "crypto";
import pool from "../../../lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // check user
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    const user = result.rows[0];

if (!user) {
  return NextResponse.json({ success: true, message: "If that email exists, a reset link was sent." });
}

    // generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

    // store token
    console.log(token, expiry);

    await pool.query(
      `UPDATE users 
       SET reset_token = $1, reset_token_expiry = $2
       WHERE email = $3`,
      [token, expiry, email],
    );
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset/${token}`;

await resend.emails.send({
  from: "Nepogames <no-reply@support.nepogames.com>",
  to: email,
  subject: "Reset your password",
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Reset your password</title>
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
                    Nepogames 
                  </span>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  <!-- Icon -->
                  <div style="width:52px;height:52px;background:#DBEAFE;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;">
                    <img src="https://img.icons8.com/ios/50/2563EB/lock-2.png" width="26" height="26" alt="" />
                  </div>

                  <h1 style="margin:0 0 8px;font-size:24px;font-weight:500;color:#0A0A0A;font-family:Georgia,serif;">
                    Reset your password
                  </h1>
                  <p style="margin:0 0 28px;font-size:15px;color:#57534E;line-height:1.6;">
                    We received a request to reset the password for your account.
                    Click the button below to choose a new one.
                  </p>

                  <!-- CTA -->
                  <a href="${resetLink}"
                     style="display:inline-block;background:#2563EB;color:#ffffff;font-size:15px;font-weight:500;
                            text-decoration:none;padding:13px 28px;border-radius:8px;">
                    Reset password
                  </a>

                  <!-- Divider -->
                  <hr style="border:none;border-top:1px solid #E7E5E4;margin:28px 0;" />

                  <!-- Fallback URL -->
                  <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#78716C;">
                    Or copy this link
                  </p>
                  <p style="margin:0 0 24px;font-size:12px;color:#2563EB;word-break:break-all;
                            background:#FAFAF9;padding:10px 12px;border-radius:6px;border:1px solid #E7E5E4;
                            font-family:monospace;">
                    ${resetLink}
                  </p>

                  <!-- Expiry notice -->
                  <table cellpadding="0" cellspacing="0" style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;margin-bottom:4px;">
                    <tr>
                      <td style="padding:12px 14px;font-size:13px;color:#9A3412;line-height:1.5;">
                        ⏱ This link expires in <strong>15 minutes</strong>. If you didn't request a
                        password reset, you can safely ignore this email — your password won't change.
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
                    If you have trouble, contact <a href="mailto:support@nepogames.com" style="color:#78716C;">support@nepogames.com</a>.
                  </p>
                  <p style="margin:8px 0 0;font-size:12px;color:#A8A29E;">
                    © 2026 Nepogames
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

    return NextResponse.json({
      success: true,
      message: "Reset email sent",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
