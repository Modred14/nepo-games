// ROUTE: src/lib/cache.js
/**
 * lib/cache.js
 *
 * A simple cache layer that:
 *   - Uses Redis (via ioredis) if REDIS_URL is set in .env
 *   - Falls back to a Node.js in-memory Map if Redis isn't available
 *
 * This means you get ZERO cost to start (in-memory), and you can
 * upgrade to Redis at any time just by adding REDIS_URL to your .env.
 *
 * Install Redis client (only needed if you use Redis):
 *   npm install ioredis
 */

// ─── In-memory fallback cache ─────────────────────────────────────────────────
const memCache = new Map(); // key → { value, expiresAt }

function memGet(key) {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memCache.delete(key);
    return null;
  }
  return entry.value;
}

function memSet(key, value, ttlSeconds) {
  memCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

function memDelete(key) {
  memCache.delete(key);
}

// Keeps the in-memory fallback from growing without bound (rate-limit keys
// are created per IP/email, so an attacker could otherwise inflate it).
function memSweep() {
  if (memCache.size < 5000) return;
  const now = Date.now();
  for (const [k, v] of memCache) {
    if (now > v.expiresAt) memCache.delete(k);
  }
}

// ─── Redis client (lazy-initialized) ─────────────────────────────────────────
let redis = null;

async function getRedis() {
  if (redis) return redis;
  if (!process.env.REDIS_URL) return null;

  try {
    const { default: Redis } = await import("ioredis");
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    await redis.connect();
    console.log("✅ Redis cache connected");
    return redis;
  } catch (err) {
    console.warn("⚠️  Redis unavailable, falling back to in-memory cache:", err.message);
    redis = null;
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get a cached value.
 * Returns the parsed value, or null if not found / expired.
 */
export async function getCached(key) {
  try {
    const r = await getRedis();
    if (r) {
      const raw = await r.get(key);
      return raw ? JSON.parse(raw) : null;
    }
    return memGet(key);
  } catch (err) {
    console.warn("Cache GET error:", err.message);
    return null;
  }
}

/**
 * Set a cached value with a TTL in seconds.
 */
export async function setCached(key, value, ttlSeconds = 60) {
  try {
    const r = await getRedis();
    if (r) {
      await r.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } else {
      memSet(key, value, ttlSeconds);
    }
  } catch (err) {
    console.warn("Cache SET error:", err.message);
  }
}

/**
 * Invalidate (delete) a cached value.
 * Call this after writes that should bust the cache.
 */
export async function invalidateCache(key) {
  try {
    const r = await getRedis();
    if (r) {
      await r.del(key);
    } else {
      memDelete(key);
    }
  } catch (err) {
    console.warn("Cache DELETE error:", err.message);
  }
}

/**
 * Atomically increment a counter and return the new value. The TTL is set
 * when the counter is created (fixed window). Used by the rate limiter.
 * Redis INCR is atomic across instances; the in-memory fallback is only
 * correct within a single process, so set REDIS_URL in production.
 * Throws on Redis failure so callers can decide whether to fail open/closed.
 */
export async function incrementCounter(key, ttlSeconds = 60) {
  const r = await getRedis();
  if (r) {
    const n = await r.incr(key);
    if (n === 1) {
      await r.expire(key, ttlSeconds);
    } else if (n % 20 === 0) {
      // Self-heal a counter whose EXPIRE call was lost.
      const ttl = await r.ttl(key);
      if (ttl === -1) await r.expire(key, ttlSeconds);
    }
    return n;
  }
  memSweep();
  const entry = memCache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    memCache.set(key, { value: 1, expiresAt: Date.now() + ttlSeconds * 1000 });
    return 1;
  }
  entry.value += 1;
  return entry.value;
}
