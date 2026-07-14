// File: src/lib/emails/sendAdminAlert.js
import { resend } from "../resend";

// Fire-and-forget alert for situations where money moved but the system
// couldn't automatically attribute it to a user (e.g. a DVA transfer for an
// account number we don't recognise). This is a safety net so "logged to a
// table nobody reads" doesn't become the actual failure mode — someone gets
// notified to reconcile it manually.
//
// If ADMIN_ALERT_EMAIL isn't set, this just logs instead of throwing, so a
// missing env var can never crash a webhook that otherwise succeeded.
export async function sendAdminAlert(subject, details) {
  const to = "favourdomirin@gmail.com";
  if (!to) {
    console.warn("⚠️ ADMIN_ALERT_EMAIL not set — skipping admin alert:", subject);
    return;
  }

  return await resend.emails.send({
    from: "Nepogames Alerts <no-reply@support.nepogames.com>",
    to,
    subject: `🚨 ${subject}`,
    html: `
      <div style="font-family:monospace; white-space:pre-wrap; padding:16px;">
        <h2 style="margin:0 0 12px;">${subject}</h2>
        <pre style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;">${JSON.stringify(details, null, 2)}</pre>
      </div>
    `,
    text: `${subject}\n\n${JSON.stringify(details, null, 2)}`,
  });
}