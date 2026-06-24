import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { encode, decode } from "next-auth/jwt";
import { cookies } from "next/headers";
import pool from "../../../../lib/db";

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ error: "No reference" }, { status: 400 });
  }

  const verifyRes = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    },
  );

  const data = await verifyRes.json();

  if (!data.status || data.data.status !== "success") {
    return NextResponse.json({ error: "Payment not successful" }, { status: 400 });
  }

  const plan = data.data.metadata?.plan;

  if (!plan) {
    return NextResponse.json({ error: "Plan not found in metadata" }, { status: 400 });
  }

  const planDurations = { pro: 30, plus: 90, premium: 365 };
  const days = planDurations[plan];

  if (!days) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const now = new Date();
   const existing = await pool.query(
  `SELECT subscription_end FROM users WHERE id = $1`,
  [session.user.id]
);

const currentEnd = existing.rows[0]?.subscription_end;
const startFrom = currentEnd && new Date(currentEnd) > now 
  ? new Date(currentEnd) 
  : now;

const end = new Date(startFrom);
end.setDate(end.getDate() + days);


  // Update DB
  const result = await pool.query(
    `UPDATE users
     SET plan = $1,
         subscription_status = 'active',
         subscription_start = $2,
         subscription_end = $3
     WHERE id = $4
     RETURNING plan, subscription_status, subscription_start, subscription_end`,
    [plan, startFrom, end, session.user.id],
  );

  const updated = result.rows[0];

  // Reissue JWT — your token nests everything under token.user
  const isProduction = process.env.NODE_ENV === "production";
  const cookieName = isProduction
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  const cookieStore = await cookies();
  const existingToken = cookieStore.get(cookieName)?.value;

  const currentToken = await decode({
    token: existingToken,
    secret: process.env.NEXTAUTH_SECRET,
  });



  const newToken = await encode({
    token: {
      ...currentToken,
      user: {
        ...currentToken.user,
        plan: updated.plan,
        subscription_status: updated.subscription_status,
        subscription_start: updated.subscription_start,
        subscription_end: updated.subscription_end,
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
  });

  cookieStore.set(cookieName, newToken, {
    httpOnly: true,
    secure: isProduction,
    path: "/",
    sameSite: "lax",
  });

  return NextResponse.json({ success: true });
}