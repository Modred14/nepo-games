import { Webhook } from "svix";
// netlify/functions/email-webhook.js
export async function handler(event) {
  const email = "support.nepogames@gmail.com";

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET);
  let payload;
  try {
    payload = wh.verify(event.body, {
      "svix-id": event.headers["svix-id"],
      "svix-timestamp": event.headers["svix-timestamp"],
      "svix-signature": event.headers["svix-signature"],
    });
  } catch {
    return { statusCode: 400, body: "Invalid signature" };
  }

  if (payload.type !== "email.received") {
    return { statusCode: 200, body: "Ignored" };
  }

  const { from, subject, html, text } = payload.data;

  const forwardResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Nepogames Support <contact@support.nepogames.com>",
      to: [email],
      subject: `[Support] ${subject}`,
      html: html || `<p>${text}</p>`,
      reply_to: from,
    }),
  });

  if (!forwardResponse.ok) {
    const err = await forwardResponse.text();
    console.error("Failed to forward email:", err);
    return { statusCode: 500, body: "Failed to forward" };
  }

  return { statusCode: 200, body: "Forwarded" };
}
