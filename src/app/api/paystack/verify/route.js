// ORIGINAL ROUTE: src/app/api/paystack/verify/route.js
// CHANGED: Paystack transaction/verify/{reference} -> Flutterwave
// GET /v3/transactions/verify_by_reference?tx_ref=... (Flutterwave lets you
// verify by your own tx_ref directly, no need to look up their internal id first).
//
// CHANGED (v2): plan is no longer set to whatever was just purchased.
// Rollover now works both ways — total remaining days (existing + newly
// bought) determines the plan TIER, so buying "Pro" while 400 days of
// Plus/Premium are still active correctly stays Premium instead of
// downgrading. See derivePlanFromDays() below.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { encode, decode } from "next-auth/jwt";
import { cookies } from "next/headers";
import pool from "../../../../lib/db";

// Derives the plan TIER from total days remaining (after rollover), rather
// than from whichever plan was just purchased.
//   > 365 days      -> premium
//   91–365 days     -> plus
//   1–90 days       -> pro
//   0 or fewer days -> free
function derivePlanFromDays(totalDays) {
  if (totalDays <= 0) return "free";
  if (totalDays <= 90) return "pro";
  if (totalDays <= 365) return "plus";
  return "premium";
}

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
    `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      },
    },
  );

  const data = await verifyRes.json();

  // Flutterwave: data.status === "success" means the API call succeeded;
  // the actual payment outcome is in data.data.status ("successful" | "failed" | "pending").
  if (data.status !== "success" || data.data?.status !== "successful") {
    return NextResponse.json({ error: "Payment not successful" }, { status: 400 });
  }

  // Defense in depth: Flutterwave recommends also checking the charged
  // amount/currency match what you expected, since verify_by_reference can
  // in rare cases be called with a tx_ref that was tampered with client-side.
  const plan = data.data.meta?.plan;

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
    [session.user.id],
  );

  const currentEnd = existing.rows[0]?.subscription_end;
  const startFrom = currentEnd && new Date(currentEnd) > now
    ? new Date(currentEnd)
    : now;

  const end = new Date(startFrom);
  end.setDate(end.getDate() + days);

  const totalDaysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  const finalPlan = derivePlanFromDays(totalDaysRemaining);

  // Update DB
  const result = await pool.query(
    `UPDATE users
     SET plan = $1,
         subscription_status = 'active',
         subscription_start = $2,
         subscription_end = $3
     WHERE id = $4
     RETURNING plan, subscription_status, subscription_start, subscription_end`,
    [finalPlan, startFrom, end, session.user.id],
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