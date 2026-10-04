// ROUTE: src/app/api/paystack/verify/route.js
//
// Called by /payment-success after Flutterwave redirects the buyer back.
//
// SECURITY (audit hardening) — the previous version:
//   * accepted ANY successful Flutterwave reference from ANY logged-in user,
//   * had no idempotency, so the same paid reference could be replayed over and
//     over to extend a subscription indefinitely for free,
//   * trusted `meta.plan` instead of the amount actually paid, and
//   * never checked the reference belonged to the caller.
// Now: the reference must be one OUR server generated for THIS user and for a
// subscription, the verified amount must equal the server price list, and the
// grant goes through the same idempotent routine as the webhook, so whichever
// of the two arrives first wins and the other is a no-op.
import { NextResponse } from "next/server";
import { encode, decode } from "next-auth/jwt";
import { cookies } from "next/headers";
import pool from "../../../../lib/db";
import { requireUser } from "@/lib/auth";
import { checkRateLimit, tooManyRequests } from "@/lib/rateLimit";
import { PLAN_PRICES, applySubscriptionPayment } from "@/lib/subscriptions";
import { verifyByReference, markProcessed, parseTxRef } from "@/lib/flutterwaveVerify";

const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // must match authOptions.session.maxAge

export async function GET(req) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(`pay-verify:${user.id}`, { limit: 20, windowSeconds: 300 });
  if (!rl.allowed) return tooManyRequests();

  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");

  const parsed = parseTxRef(reference);
  if (!parsed || parsed.purpose !== "subscription") {
    return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
  }
  // The reference must belong to the person asking.
  if (Number(parsed.userId) !== Number(user.id)) {
    return NextResponse.json({ error: "Invalid reference" }, { status: 403 });
  }

  const verification = await verifyByReference(reference);
  if (verification.status === "error") {
    return NextResponse.json({ error: "Could not verify payment, try again" }, { status: 503 });
  }
  if (verification.status !== "ok") {
    return NextResponse.json({ error: "Payment not found" }, { status: 400 });
  }
  const verified = verification.data;

  if (
    verified.tx_ref !== reference ||
    String(verified.status || "").toLowerCase() !== "successful" ||
    String(verified.currency || "").toUpperCase() !== "NGN"
  ) {
    return NextResponse.json({ error: "Payment not successful" }, { status: 400 });
  }

  const expected = PLAN_PRICES[parsed.plan];
  if (!expected || Math.round(Number(verified.amount)) !== expected) {
    return NextResponse.json({ error: "Payment amount does not match plan" }, { status: 400 });
  }

  // Idempotent grant (no-op if the webhook already applied this reference).
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await applySubscriptionPayment(client, {
      userId: user.id,
      plan: parsed.plan,
      reference,
      amount: expected,
      markProcessed,
    });
    await client.query("COMMIT");
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error("Subscription verify error:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    client.release();
  }

  // Refresh the session cookie from the database (the source of truth).
  try {
    const fresh = await pool.query(
      `SELECT plan, subscription_status, subscription_start, subscription_end
         FROM users WHERE id = $1`,
      [user.id],
    );
    const updated = fresh.rows[0];

    const isProduction = process.env.NODE_ENV === "production";
    const cookieName = isProduction
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    const cookieStore = await cookies();
    const existingToken = cookieStore.get(cookieName)?.value;
    const currentToken = existingToken
      ? await decode({ token: existingToken, secret: process.env.NEXTAUTH_SECRET })
      : null;

    if (currentToken && updated) {
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
        maxAge: SESSION_MAX_AGE, // next-auth's default would silently be 30 days
      });

      cookieStore.set(cookieName, newToken, {
        httpOnly: true,
        secure: isProduction,
        path: "/",
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE,
      });
    }
  } catch (err) {
    // The grant itself succeeded; a stale cookie is refreshed on next login.
    console.error("Session cookie refresh failed:", err.message);
  }

  return NextResponse.json({ success: true });
}
