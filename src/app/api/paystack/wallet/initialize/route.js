// File: src/app/api/paystack/wallet/initialize/route.js
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

  const response = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session.user.email,
        amount: Math.round(amount * 100), // kobo
        metadata: {
          userId: session.user.id,
          purpose: "wallet",
          // Store the exact amount the user asked to fund. If Paystack's
          // fee-bearer setting has the customer covering the transaction
          // charge, data.amount on the webhook can come back higher than
          // this — we don't want that extra charge credited to the wallet.
          requestedAmount: amount,
        },
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/profile?tab=account`,
      }),
    },
  );

  const data = await response.json();

  return NextResponse.json({
    url: data.data.authorization_url,
  });
}