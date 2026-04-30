import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const PLAN_PRICES = {
  pro: 290000,
  plus: 850000,
  premium: 3200000,
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
        amount,
        metadata: {
          userId: session.user.id,
          plan,
        },
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success`,
      }),
    },
  );

  const data = await response.json();

  return NextResponse.json({
    url: data.data.authorization_url,
  });
}
