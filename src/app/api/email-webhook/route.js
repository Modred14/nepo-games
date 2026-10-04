// ROUTE: src/app/api/email-webhook/route.js
import { Webhook } from "svix";
import { escapeHtml } from "@/lib/html";

export async function POST(request) {
  // Staff mailbox that inbound mail is forwarded to (was hardcoded).
  const email = process.env.SUPPORT_FORWARD_EMAIL;
  if (!email || !process.env.RESEND_WEBHOOK_SECRET) {
    console.error("email-webhook: SUPPORT_FORWARD_EMAIL / RESEND_WEBHOOK_SECRET not configured");
    return Response.json({ error: "Not configured" }, { status: 500 });
  }
  const body = await request.text();
  const headers = request.headers;

  const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET);
  let payload;
  try {
    payload = wh.verify(body, {
      "svix-id": headers.get("svix-id"),
      "svix-timestamp": headers.get("svix-timestamp"),
      "svix-signature": headers.get("svix-signature"),
    });
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (payload.type !== "email.received") {
    return Response.json({ ignored: true });
  }

  const { from, subject, email_id, received_for } = payload.data;

  // Fetch the full email content from Resend

  
  const htmlBody = `<p>${"(You have a new mail kindly check your resend dashboard)"}</p>`;

  const forwardResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Nepogames Support <contact@support.nepogames.com>",
      to: [email],
      subject: String(subject || "(no subject)").replace(/[\r\n]+/g, " ").slice(0, 200),
      html: `<p><strong>From:</strong> ${escapeHtml(from)}</p>
             <p><strong>To:</strong> ${escapeHtml(received_for?.[0])}</p>
             <hr/>
             ${htmlBody}`,
      reply_to: from,
    }),
  });

  if (!forwardResponse.ok) {
    const err = await forwardResponse.text();
    console.error("Failed to forward:", err);
    return Response.json({ error: "Failed to forward" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
