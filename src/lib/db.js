// File: src/lib/db.js
import pkg from "pg";
const { Pool } = pkg;

// `max: 5` was fine at low traffic but becomes a bottleneck fast at scale —
// every webhook, page load, and API route competes for the same 5
// connections, and requests start queuing (or timing out) well before you
// get anywhere near "millions of users". Made configurable via
// PGPOOL_MAX so it can be tuned per environment without a code change;
// defaults to a much higher ceiling than before.
// NOTE: if you're on Neon, prefer using Neon's *pooled* connection string
// (the one with "-pooler" in the hostname) for DATABASE_URL — it fronts
// this with PgBouncer on Neon's side, which matters more at scale than the
// `max` value here.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: Number(process.env.PGPOOL_MAX) || 20,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 15000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export async function query(text, params, retries = 1) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    const RETRYABLE = ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"];
    if (retries > 0 && RETRYABLE.includes(err.code)) {
      console.warn(`${err.code} — retrying query...`);
      return query(text, params, retries - 1);
    }
    throw err;
  }
}
export default pool;