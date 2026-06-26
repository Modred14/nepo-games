import { Webhook } from "svix";

export async function POST(request) {
  const email = "support.nepogames@gmail.com";
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
    return Response.json({ error: "Failed to forward" }, { status: 500 });
  }

  return Response.json({ ok: true });
}