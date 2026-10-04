// ROUTE: src/app/api/banks/route.js
// Proxy for Flutterwave's Nigerian bank list. It used to be an open endpoint
// that spent one authenticated Flutterwave call per request; the list barely
// changes, so it is now cached for 6 hours and rate-limited per IP.
import { NextResponse } from "next/server";
import { getCached, setCached } from "@/lib/cache";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rateLimit";

export async function GET(req) {
  try {
    const rl = await checkRateLimit(`banks:${getClientIp(req)}`, { limit: 30, windowSeconds: 60 });
    if (!rl.allowed) return tooManyRequests();

    const cached = await getCached("flw:banks:NG");
    if (cached) return NextResponse.json({ data: cached });

    const res = await fetch("https://api.flutterwave.com/v3/banks/NG", {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.status !== "success") {
      return NextResponse.json({ error: "Unable to fetch bank list" }, { status: 400 });
    }

    await setCached("flw:banks:NG", data.data, 60 * 60 * 6);
    return NextResponse.json({ data: data.data });
  } catch (err) {
    console.error("Bank list fetch error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
