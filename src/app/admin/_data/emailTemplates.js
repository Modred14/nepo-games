// ROUTE: src/app/admin/_data/emailTemplates.js
// src/app/admin/_data/emailTemplates.js  (NEW)
//
// ADMIN DASHBOARD: read-only catalog backing /admin/email-templates.
//
// WHY THIS IS A HAND-CURATED SNAPSHOT, NOT A LIVE FILE READER:
// Nepogames sends email from 8 separate files, each with its own inline
// `resend.emails.send({ html: "..." })` call — there is no shared
// template system anywhere in the codebase (verified by searching every
// call site: src/app/api/auth/[...nextauth]/route.js,
// src/app/api/forgot-password/route.js, src/app/api/seller/welcome/route.js,
// src/app/api/send-email-otp/route.js, src/app/api/users/route.js,
// src/app/api/c/[slug]/dispute/route.js, src/lib/emails/sendSellerWelcome.js,
// src/lib/emails/sendAdminAlert.js). Two of those are password reset and
// OTP verification — among the most security-sensitive flows in the app.
//
// Reading those files live at request time (via Node's `fs`) was
// considered and rejected: Next.js's serverless bundler only reliably
// includes files it detects through static `import`/`require` analysis.
// An arbitrary runtime `fs.readFileSync()` of a sibling route file is
// NOT guaranteed to be present in the deployed bundle (especially on
// Netlify) — it could work locally and silently 404 in production. That
// risk wasn't worth taking for a read-only convenience feature.
//
// So this file is a snapshot, captured directly from the live source
// during this work. `htmlPreview` is included ONLY where the full
// template was read and verbatim-copied in full (not paraphrased,
// summarized, or reconstructed) — those are marked
// `previewFidelity: "verbatim"`. For the rest, only accurate metadata
// (exact subject line, trigger, dynamic variables, and a plain-English
// summary of the content) is included, marked
// `previewFidelity: "metadata-only"` — rather than risk showing a
// subtly-wrong reconstruction of an email as if it were the real thing.
// EITHER WAY: this file is never imported by any live email-sending
// route. Editing it changes nothing about what actually gets sent — see
// /admin/email-templates for that explanation surfaced to the admin too.
//
// If an email's actual copy is edited directly in its source file later,
// this snapshot will NOT automatically reflect that — it will need a
// manual refresh. That staleness risk is the deliberate tradeoff for
// avoiding the runtime-fs risk above.

export const EMAIL_TEMPLATES = [
  {
    id: "verify-email",
    name: "Verify your email address",
    subject: "Verify your email address",
    trigger: "Sent on signup (credentials) and when a Google-signed-up account first needs email verification.",
    triggerFiles: [
      "src/app/api/auth/[...nextauth]/route.js",
      "src/app/api/users/route.js",
    ],
    dynamicVariables: ["verifyLink"],
    summary:
      "Welcome banner image, a headline 'Verify your email address', a short paragraph, a blue 'Verify email address' button linking to the verify link, and a fallback plain-text copy of the link below it. Same template is sent from two different files (signup route and the NextAuth callback) — both were checked and contain the same content.",
    previewFidelity: "metadata-only",
  },
  {
    id: "reset-password",
    name: "Reset your password",
    subject: "Reset your password",
    trigger: "Sent when a user requests a password reset from the forgot-password flow.",
    triggerFiles: ["src/app/api/forgot-password/route.js"],
    dynamicVariables: ["resetLink", "email"],
    previewFidelity: "verbatim",
    htmlPreview: `
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
              <tr>
                <td style="background:#0A0A0A;padding:24px 40px;">
                  <span style="font-family:Georgia,serif;font-size:20px;color:#ffffff;font-weight:400;letter-spacing:-0.3px;">
                    Nepogames
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:36px 40px;">
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
                  <a href="{{resetLink}}"
                     style="display:inline-block;background:#2563EB;color:#ffffff;font-size:15px;font-weight:500;
                            text-decoration:none;padding:13px 28px;border-radius:8px;">
                    Reset password
                  </a>
                  <hr style="border:none;border-top:1px solid #E7E5E4;margin:28px 0;" />
                  <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#78716C;">
                    Or copy this link
                  </p>
                  <p style="margin:0 0 24px;font-size:12px;color:#2563EB;word-break:break-all;
                            background:#FAFAF9;padding:10px 12px;border-radius:6px;border:1px solid #E7E5E4;
                            font-family:monospace;">
                    {{resetLink}}
                  </p>
                  <table cellpadding="0" cellspacing="0" style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;margin-bottom:4px;">
                    <tr>
                      <td style="padding:12px 14px;font-size:13px;color:#9A3412;line-height:1.5;">
                        \u23f1 This link expires in <strong>15 minutes</strong>. If you didn't request a
                        password reset, you can safely ignore this email — your password won't change.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background:#FAFAF9;border-top:1px solid #E7E5E4;padding:20px 40px;">
                  <p style="margin:0 0 4px;font-size:12px;color:#78716C;line-height:1.6;">
                    This email was sent to <strong>{{email}}</strong>.
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
  },
  {
    id: "otp-code",
    name: "Your Nepogames OTP Code",
    subject: "Your Nepogames OTP Code",
    trigger: "Sent when a phone/account verification one-time code is requested.",
    triggerFiles: ["src/app/api/send-email-otp/route.js"],
    dynamicVariables: ["otp", "email", "currentYear"],
    previewFidelity: "verbatim",
    htmlPreview: `
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
                      <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
                        <tr>
                          <td align="center">
                            <div style="display:inline-block;background:#F0F9FF;border:1px solid #BFDBFE;
                                        border-radius:12px;padding:20px 48px;">
                              <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#1D4ED8;font-family:monospace;">
                                {{otp}}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </table>
                      <table cellpadding="0" cellspacing="0" style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;width:100%;">
                        <tr>
                          <td style="padding:12px 14px;font-size:13px;color:#9A3412;line-height:1.5;">
                            \u23f1 This code expires in <strong>10 minutes</strong>. If you didn't request this,
                            you can safely ignore this email.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#FAFAF9;border-top:1px solid #E7E5E4;padding:20px 40px;">
                      <p style="margin:0 0 4px;font-size:12px;color:#78716C;line-height:1.6;">
                        This email was sent to <strong>{{email}}</strong>.
                        Questions? Contact <a href="mailto:support@nepogames.com" style="color:#78716C;">support@nepogames.com</a>.
                      </p>
                      <p style="margin:8px 0 0;font-size:12px;color:#A8A29E;">
                        © {{currentYear}} Nepogames. All rights reserved.
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
  },
  {
    id: "seller-welcome",
    name: "You're now a seller (account activated)",
    subject: "You're now a seller on Nepogames \ud83c\udfae",
    trigger: "Sent when a user's seller account is activated (becomes able to list games for sale).",
    triggerFiles: ["src/app/api/seller/welcome/route.js"],
    dynamicVariables: ["first_name", "username", "email", "currentYear"],
    previewFidelity: "verbatim",
    htmlPreview: `
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
                  <tr>
                    <td>
                      <img src="https://res.cloudinary.com/dagot597u/image/upload/v1776988411/welcome_mfzptd.png"
                           alt="Welcome Seller" width="520"
                           style="display:block;border:none;width:100%;max-height:200px;object-fit:cover;" />
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:36px 40px;">
                      <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                        <tr>
                          <td style="width:52px;height:52px;background:#DCFCE7;border-radius:12px;text-align:center;vertical-align:middle;">
                            <img src="https://img.icons8.com/ios/50/16A34A/shop.png" width="26" height="26" alt="" />
                          </td>
                        </tr>
                      </table>
                      <h1 style="margin:0 0 8px;font-size:24px;font-weight:500;color:#0A0A0A;font-family:Georgia,serif;">
                        Congratulations, {{first_name}}!
                      </h1>
                      <p style="margin:0 0 28px;font-size:15px;color:#57534E;line-height:1.6;">
                        Your seller account (<strong>@{{username}}</strong>) is now active on <strong>Nepogames</strong>.
                        You can start listing your game accounts and reaching buyers right away.
                      </p>
                      <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;border:1px solid #E7E5E4;border-radius:10px;overflow:hidden;">
                        <tr>
                          <td style="padding:16px 20px;border-bottom:1px solid #E7E5E4;">
                            <p style="margin:0 0 2px;font-size:13px;font-weight:600;color:#0A0A0A;">\ud83d\udce6 List your first account</p>
                            <p style="margin:0;font-size:13px;color:#78716C;line-height:1.5;">
                              Head to your dashboard and create a listing. Add clear photos, a fair price, and an honest description.
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:16px 20px;border-bottom:1px solid #E7E5E4;">
                            <p style="margin:0 0 2px;font-size:13px;font-weight:600;color:#0A0A0A;">\ud83d\udcac Respond to buyers quickly</p>
                            <p style="margin:0;font-size:13px;color:#78716C;line-height:1.5;">
                              Fast responses build trust and improve your seller rating. Check your messages regularly.
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:16px 20px;">
                            <p style="margin:0 0 2px;font-size:13px;font-weight:600;color:#0A0A0A;">\u2b50 Build your reputation</p>
                            <p style="margin:0;font-size:13px;color:#78716C;line-height:1.5;">
                              Every successful sale earns you a review. Great ratings mean more visibility and more sales.
                            </p>
                          </td>
                        </tr>
                      </table>
                      <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
                        <tr>
                          <td align="center">
                            <a href="{{baseUrl}}/sell-game"
                               style="display:inline-block;background:#16A34A;color:#ffffff;font-size:15px;font-weight:500;
                                      text-decoration:none;padding:13px 32px;border-radius:8px;">
                              List your first account
                            </a>
                          </td>
                        </tr>
                      </table>
                      <hr style="border:none;border-top:1px solid #E7E5E4;margin:0 0 24px;" />
                      <table cellpadding="0" cellspacing="0" style="background:#FAFAF9;border:1px solid #E7E5E4;border-radius:8px;width:100%;">
                        <tr>
                          <td style="padding:14px 16px;font-size:13px;color:#57534E;line-height:1.6;">
                            \ud83d\udee1 Need help? Visit our <a href="{{baseUrl}}/contact" style="color:#1D4ED8;text-decoration:none;">Seller Help Centre</a> or
                            email us at <a href="mailto:support@nepogames.com" style="color:#1D4ED8;text-decoration:none;">support@nepogames.com</a>.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#FAFAF9;border-top:1px solid #E7E5E4;padding:20px 40px;">
                      <p style="margin:0 0 4px;font-size:12px;color:#78716C;line-height:1.6;">
                        This email was sent to <strong>{{email}}</strong>.
                        Questions? Contact <a href="mailto:support@nepogames.com" style="color:#78716C;">support@nepogames.com</a>.
                      </p>
                      <p style="margin:8px 0 0;font-size:12px;color:#A8A29E;">
                        © {{currentYear}} Nepogames. All rights reserved.
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
  },
  {
    id: "subscription-welcome",
    name: "Welcome to Nepogames Seller Program (subscription/plan upgrade)",
    subject: "\ud83c\udf89 Welcome to Nepogames Seller Program",
    trigger: "Sent when a user's subscription plan (Pro/Plus/Premium) is activated — distinct from the plain 'now a seller' email above, this one is about the paid-tier upgrade specifically.",
    triggerFiles: ["src/lib/emails/sendSellerWelcome.js"],
    dynamicVariables: ["duration", "email", "plan"],
    summary:
      "Lists paid-tier benefits: lower selling fees, top search placement, featured homepage listings, a 'Verified Seller' badge, faster payouts, priority dispute resolution, sales analytics, and access to high-value buyers. Confirms the plan name and duration purchased.",
    previewFidelity: "metadata-only",
  },
  {
    id: "dispute-raised",
    name: "Dispute Raised (seller notification)",
    subject: "\u26a0\ufe0f Dispute Raised — {{game_title}} (Ref: {{payment_reference}})",
    trigger: "Sent to a seller when a buyer opens a dispute on a transaction, notifying them escrow is frozen pending admin review.",
    triggerFiles: ["src/app/api/c/[slug]/dispute/route.js"],
    dynamicVariables: ["game_title", "payment_reference"],
    summary:
      "Alerts the seller that a dispute has been raised on a specific transaction (named by game title and payment reference), that the funds are frozen, and that Nepogames support will review it.",
    previewFidelity: "metadata-only",
  },
  {
    id: "admin-alert",
    name: "Admin Alert (internal ops notification)",
    subject: "\ud83d\udea8 {{subject}} (dynamic — varies per alert)",
    trigger:
      "Internal-only — never sent to a customer. Fired from a handful of specific code paths for situations needing manual admin attention (e.g. an unattributed wallet-funding transfer, or a withdrawal that couldn't be confirmed against Flutterwave — see src/app/api/user/withdraw/route.js and src/app/api/paystack/webhook/route.js for callers).",
    triggerFiles: ["src/lib/emails/sendAdminAlert.js"],
    dynamicVariables: ["subject", "details (arbitrary JSON, rendered into the body)"],
    summary:
      "Plain internal alert email with a subject prefixed '🚨' and whatever details object the caller passed in, sent to a single hardcoded internal recipient address rather than a configurable one.",
    previewFidelity: "metadata-only",
    note: "The recipient address is hardcoded in the source rather than read from an env var or admin setting — worth knowing if that inbox ever changes.",
  },
];