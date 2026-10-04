// ROUTE: src/lib/rateLimit.js
// src/lib/rateLimit.js
//
// Fixed-window rate limiter on top of the existing cache layer
// (src/lib/cache.js — Redis if REDIS_URL is set, in-memory otherwise).
//
// SECURITY: the previous version did a read-then-write (get, then set), so
// parallel requests could all read the same counter and slip past the limit.
// This version uses an atomic INCR (incrementCounter in cache.js).
//
// IMPORTANT: without REDIS_URL the counters live in one server process only.
// On a multi-machine deployment each machine has its own counters, so the
// effective limit is limit x machines. Set REDIS_URL in production.
import { incrementCounter } from "./cache";

// Returns { allowed: boolean, remaining: number }.
// `failClosed: true` should be used for endpoints where an outage of the
// limiter must not become an attack window (login, OTP, password reset).
export async function checkRateLimit(
  key,
  { limit = 10, windowSeconds = 60, failClosed = false } = {},
) {
  const cacheKey = `ratelimit:${key}`;
  try {
    const count = await incrementCounter(cacheKey, windowSeconds);
    if (count > limit) return { allowed: false, remaining: 0 };
    return { allowed: true, remaining: Math.max(0, limit - count) };
  } catch (err) {
    console.error(`checkRateLimit(${key}) failed:`, err.message);
    return failClosed
      ? { allowed: false, remaining: 0 }
      : { allowed: true, remaining: limit };
  }
}

// Best-effort client IP. Fly.io's proxy sets `fly-client-ip` (it cannot be
// spoofed by the client); other proxies fall back to x-forwarded-for.
export function getClientIp(req) {
  const h = req?.headers;
  if (!h?.get) return "unknown";
  return (
    h.get("fly-client-ip") ||
    h.get("x-real-ip") ||
    (h.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "unknown"
  );
}

export function tooManyRequests(message = "Too many requests. Please try again later.") {
  return Response.json({ error: message }, { status: 429 });
}
