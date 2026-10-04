// ROUTE: src/app/api/paystack/wallet/initialize/route.js
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { checkRateLimit, tooManyRequests } from "@/lib/rateLimit";

const MIN_FUNDING = 100;
const MAX_FUNDING = 5_000_000; // naira — keeps a typo/abuse from creating absurd charges

export async function POST(req) {
  // requireUser (not just a session check) so suspended/banned accounts
  // cannot start new payments.
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(`wallet-init:${user.id}`, { limit: 10, windowSeconds: 600 });
  if (!rl.allowed) return tooManyRequests();

  const body = await req.json().catch(() => ({}));
  const amount = Number(body?.amount);

  // The old check (`!amount || amount < 100`) let strings, NaN and fractions
  // through. The credited amount is whole naira, validated here.
  if (!Number.isInteger(amount) || amount < MIN_FUNDING || amount > MAX_FUNDING) {
    return NextResponse.json(
      { error: `Enter a whole amount between ₦${MIN_FUNDING} and ₦${MAX_FUNDING.toLocaleString()}` },
      { status: 400 },
    );
  }

  const tx_ref = `wallet_${user.id}_${Date.now()}`;

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
      redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/profile?tab=account`,
      customer: { email: user.email },
      meta: {
        userId: user.id,
        purpose: "wallet",
        requestedAmount: amount,
      },
    }),
    signal: AbortSignal.timeout(15000),
  }).catch(() => null);

  const data = response ? await response.json().catch(() => null) : null;

  if (!data || data.status !== "success" || !data.data?.link) {
    console.error("Flutterwave wallet initialize failed");
    return NextResponse.json({ error: "Payment init failed" }, { status: 502 });
  }

  return NextResponse.json({ url: data.data.link });
}
