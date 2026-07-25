// ORIGINAL ROUTE: src/app/api/paystack/wallet/initialize/route.js
// CHANGED: Paystack transaction/initialize -> Flutterwave /v3/payments
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount } = await req.json();

  if (!amount || amount < 100) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const tx_ref = `wallet_${session.user.id}_${Date.now()}`;

  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref,
      // Flutterwave amount is in naira, not kobo — no Math.round(amount * 100) here.
      amount: Math.round(amount),
      currency: "NGN",
      redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/profile?tab=account`,
      customer: {
        email: session.user.email,
      },
      meta: {
        userId: session.user.id,
        purpose: "wallet",
        // Store the exact amount the user asked to fund. If Flutterwave's
        // fee-bearer setting has the customer covering the transaction
        // charge, the webhook's charged_amount can come back higher than
        // this — we don't want that extra charge credited to the wallet.
        requestedAmount: amount,
      },
    }),
  });

  const data = await response.json();

  if (data.status !== "success") {
    console.error("❌ Flutterwave wallet initialize failed:", data);
    return NextResponse.json(
      { error: data.message || "Payment init failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    url: data.data.link,
  });
}
