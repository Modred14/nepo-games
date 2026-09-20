// src/lib/rateLimit.js  (NEW)
//
// ADMIN DASHBOARD PHASE 6 (final security pass): simple sliding-window
// rate limiter built on the existing Redis/in-memory cache
// (src/lib/cache.js) rather than adding new infrastructure — reuses
// whatever this environment already has (Redis if REDIS_URL is set,
// otherwise an in-memory Map, same fallback behavior as caching).
//
// Deliberately NOT applied to every admin route. The threat model for
// most of this dashboard is different from a public-facing login form:
// every route here is already behind requireAdmin()/requireSuperAdmin()
// (a real authenticated admin session), so brute-force/credential-
// stuffing isn't the risk. What IS worth limiting is a single admin
// session doing rapid, repeated high-impact actions — by mistake, a
// stuck retry loop in a script, or a compromised session. Applied to:
//   - transactions/[id]/resolve (moves real money)
//   - admins/* (privilege escalation surface)
// Left off lower-risk, read-heavy, or already-safe-by-design routes
// (e.g. the withdrawal recheck endpoint only ever reads status, never
// creates a transfer, so hammering it is merely wasteful, not dangerous).
import { getCached, setCached } from "./cache";

// Returns { allowed: boolean, remaining: number }.
export async function checkRateLimit(key, { limit = 10, windowSeconds = 60 } = {}) {
  const cacheKey = `ratelimit:${key}`;
  try {
    const current = (await getCached(cacheKey)) || 0;
    if (current >= limit) {
      return { allowed: false, remaining: 0 };
    }
    await setCached(cacheKey, current + 1, windowSeconds);
    return { allowed: true, remaining: limit - current - 1 };
  } catch (err) {
    // Fail open — a rate-limiter outage must not block legitimate admin
    // actions (e.g. releasing a stuck transaction during an incident).
    console.error(`checkRateLimit(${key}) failed, allowing request:`, err.message);
    return { allowed: true, remaining: limit };
  }
}