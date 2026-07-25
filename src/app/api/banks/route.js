// NEW FILE — did not exist before. Needed because of a change in
// src/app/profile/ProfileClient.jsx (see that file's comment).
//
// The original code called Paystack's GET /bank endpoint DIRECTLY FROM THE
// BROWSER, authorized with NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY. Paystack's bank
// list happens to be safe to expose that way (it's public, read-only data,
// and their public key is meant to be client-visible).
//
// Flutterwave's equivalent, GET /v3/banks/NG, requires your SECRET key in
// the Authorization header — it will not accept a public key. Since a
// secret key must never reach the browser, this can no longer be called
// client-side directly. This new route proxies the request server-side
// instead; ProfileClient.jsx now calls this route instead of Flutterwave
// directly.
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.flutterwave.com/v3/banks/NG", {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      },
    });
    const data = await res.json();

    if (!res.ok || data.status !== "success") {
      return NextResponse.json(
        { error: "Unable to fetch bank list" },
        { status: 400 },
      );
    }

    return NextResponse.json({ data: data.data });
  } catch (err) {
    console.error("Bank list fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
