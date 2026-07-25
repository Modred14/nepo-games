// ORIGINAL ROUTE: src/app/api/paystack/initialize/route.js
// CHANGED: Paystack transaction/initialize -> Flutterwave /v3/payments (Standard checkout)
// NOTE: file path/folder left as "paystack" so no other imports break — only the
// outbound integration inside this file was swapped. Rename the folder later if desired.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const PLAN_PRICES = {
  // NOTE: these were kobo amounts for Paystack (e.g. 290000 kobo = ₦2,900).
  // Flutterwave's /v3/payments amount field is in the major currency unit
  // (naira), not kobo — so these are now divided by 100 vs. the original file.
  pro: 2900,
  plus: 8500,
  premium: 32000,
};

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await req.json();

  const amount = PLAN_PRICES[plan];

  if (!amount) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  // Flutterwave doesn't hand back a reference the way Paystack does at
  // initialize-time — you generate the tx_ref yourself and it round-trips
  // back to you via the redirect and the webhook.
  const tx_ref = `sub_${session.user.id}_${plan}_${Date.now()}`;

  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref,
      amount,
      currency: "NGN",
      redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success`,
      customer: {
        email: session.user.email,
      },
      meta: {
        userId: session.user.id,
        purpose: "subscription",
        plan,
      },
    }),
  });

  const data = await response.json();

  if (data.status !== "success") {
    console.error("❌ Flutterwave initialize failed:", data);
    return NextResponse.json(
      { error: data.message || "Payment init failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    url: data.data.link,
  });
}
