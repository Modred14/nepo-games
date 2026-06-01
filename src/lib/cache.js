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