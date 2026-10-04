// ROUTE: src/app/api/paystack/initialize/route.js
// Subscription checkout (Flutterwave Standard). The price comes ONLY from the
// server-side price list; the client sends just the plan name.
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { PLAN_PRICES } from "@/lib/subscriptions";
import { checkRateLimit, tooManyRequests } from "@/lib/rateLimit";

export async function POST(req) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(`sub-init:${user.id}`, { limit: 10, windowSeconds: 600 });
  if (!rl.allowed) return tooManyRequests();

  const body = await req.json().catch(() => ({}));
  const plan = typeof body?.plan === "string" ? body.plan : "";

  // Own-property check so "constructor"/"__proto__" can't index the table.
  const amount = Object.prototype.hasOwnProperty.call(PLAN_PRICES, plan)
    ? PLAN_PRICES[plan]
    : null;

  if (!amount) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  // The webhook parses this reference to decide who paid for what.
  const tx_ref = `sub_${user.id}_${plan}_${Date.now()}`;

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
      customer: { email: user.email },
      meta: { userId: user.id, purpose: "subscription", plan },
    }),
    signal: AbortSignal.timeout(15000),
  }).catch(() => null);

  const data = response ? await response.json().catch(() => null) : null;

  if (!data || data.status !== "success" || !data.data?.link) {
    console.error("Flutterwave subscription initialize failed");
    return NextResponse.json({ error: "Payment init failed" }, { status: 502 });
  }

  return NextResponse.json({ url: data.data.link });
}
