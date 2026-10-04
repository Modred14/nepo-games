// ROUTE: scripts/encrypt-existing-login-details.js
// scripts/encrypt-existing-login-details.js
// One-off: encrypts login_deliveries.details rows that are still plaintext.
// Usage: DATABASE_URL=... LOGIN_DETAILS_ENCRYPTION_KEY=... node scripts/encrypt-existing-login-details.js
// Safe to re-run (already-encrypted rows are skipped).
const crypto = require("crypto");
const { Pool } = require("pg");

const raw = process.env.LOGIN_DETAILS_ENCRYPTION_KEY || "";
const key = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
if (key.length !== 32) {
  console.error("LOGIN_DETAILS_ENCRYPTION_KEY must be 32 bytes (base64 or hex).");
  process.exit(1);
}

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return `enc:v1:${iv.toString("base64")}:${c.getAuthTag().toString("base64")}:${ct.toString("base64")}`;
}

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true } });
  const { rows } = await pool.query(
    "SELECT id, details FROM login_deliveries WHERE details IS NOT NULL AND details NOT LIKE 'enc:v1:%'",
  );
  for (const r of rows) {
    await pool.query("UPDATE login_deliveries SET details = $1 WHERE id = $2", [encrypt(r.details), r.id]);
  }
  console.log(`Encrypted ${rows.length} row(s).`);
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
