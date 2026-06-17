import { resend } from "../resend";

const features = [
  "Lower selling fees on every transaction",
  "Top placement in search results",
  "Featured listings on homepage",
  "“Verified Seller” badge (build buyer trust)",
  "Faster payouts",
  "Priority dispute resolution",
  "Advanced sales & performance analytics",
  "Access to high-value buyers",
];

export async function sendSellerWelcomeEmail(duration, email, plan) {
  return await resend.emails.send({
    from: "Nepo Games <no-reply@support.nepogames.com>",
    to: email,
    subject: "🎉 Welcome to Nepo Games Seller Program",
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Welcome to Nepo Games Seller Program</title>
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
                    Nepo Games
                  </span>
                </td>
              </tr>

              <!-- Banner image -->
              <tr>
                <td>
                  <img src="https://res.cloudinary.com/dagot597u/image/upload/v1777543140/seller-verified_ufzzzd.png"
                       alt="Seller Verified" width="520"
                       style="display:block;border:none;width:100%;max-height:180px;object-fit:cover;" />
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">

                  <!-- Hero -->
                  <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
                    <tr>
                      <td align="center">
                        <div style="width:56px;height:56px;background:#DBEAFE;border-radius:50%;margin-bottom:16px;text-align:center;line-height:56px;">
                          <img src="https://img.icons8.com/ios/50/1D4ED8/verified-badge.png" width="28" height="28" alt="" style="vertical-align:middle;" />
                        </div>
                        <h1 style="margin:0 0 8px;font-size:26px;font-weight:500;color:#0A0A0A;font-family:Georgia,serif;">
                          You're a verified seller!
                        </h1>
                        <p style="margin:0;font-size:15px;color:#57534E;line-height:1.6;">
                          Welcome to Nepo Games — your journey as a trusted seller starts now.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Plan card -->
                  <table cellpadding="0" cellspacing="0" style="width:100%;background:#F0F9FF;border:1px solid #BAE6FD;border-radius:10px;margin-bottom:28px;">
                    <tr>
                      <td style="padding:20px 24px;">
                        <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#0369A1;">Activated plan</p>
                        <p style="margin:0 0 4px;font-size:22px;font-weight:600;color:#0A0A0A;font-family:Georgia,serif;">${plan.toUpperCase()} PLAN</p>
                        <p style="margin:0;font-size:14px;color:#57534E;">Duration: <strong>${duration} month${duration > 1 ? "s" : ""}</strong></p>
                      </td>
                    </tr>
                  </table>

                  <!-- Features -->
                  <p style="margin:0 0 14px;font-size:14px;font-weight:500;color:#0A0A0A;">What you can do now:</p>
                  <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
                    ${features
                      .map(
                        (item) => `
                    <tr>
                      <td style="padding:9px 0;border-bottom:1px solid #F5F5F4;font-size:14px;color:#374151;">
                        <span style="color:#1D4ED8;margin-right:10px;font-weight:700;">✓</span>${item}
                      </td>
                    </tr>`,
                      )
                      .join("")}
                  </table>

                  <!-- CTA -->
                  <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
                    <tr>
                      <td align="center">
                        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/marketplace"
                           style="display:inline-block;background:#1D4ED8;color:#ffffff;font-size:15px;font-weight:500;
                                  text-decoration:none;padding:13px 32px;border-radius:8px;">
                          Go to marketplace
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Trust badge -->
                  <table cellpadding="0" cellspacing="0" style="width:100%;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;">
                    <tr>
                      <td style="padding:12px 16px;font-size:13px;color:#166534;line-height:1.5;">
                        🛡️ NepoGames ensures a <strong>safe, secure, and trusted</strong> gaming marketplace for all users.
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
  });
}
