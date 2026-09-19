// src/lib/settings.js  (NEW)
//
// ADMIN DASHBOARD PHASE 4: reads/writes platform_settings (see
// db/migrations/006_platform_settings.sql). Every getter fails open to
// a DEFAULT matching the value that was previously hardcoded in each
// call site — if the table/migration isn't reachable for any reason,
// behavior stays exactly what it was before this feature existed,
// rather than breaking checkout/withdrawals over a settings-table
// outage.
//
// No caching layer here on purpose: settings change rarely and every
// call site that uses this already does at least one other DB query in
// the same request, so the added cost is one more indexed PK lookup —
// consistent with the same trade-off already made for account_status in
// requireUser() (see src/lib/auth.js).
import pool from "./db";

export const SETTING_DEFAULTS = {
  seller_fee_percent: 5,
  escrow_window_minutes: 30,
  minimum_withdrawal_naira: 100,
  withdrawal_fee_tiers: { tier1_max: 5000, tier1_fee: 50, tier2_max: 50000, tier2_fee: 100, tier3_fee: 150 },
};

export async function getSetting(key) {
  try {
    const res = await pool.query(`SELECT value FROM platform_settings WHERE key = $1`, [key]);
    if (res.rows[0]) return res.rows[0].value;
  } catch (err) {
    console.error(`getSetting(${key}) failed, using default:`, err.message);
  }
  return SETTING_DEFAULTS[key];
}

export async function getAllSettings() {
  const keys = Object.keys(SETTING_DEFAULTS);
  const values = await Promise.all(keys.map(getSetting));
  return Object.fromEntries(keys.map((k, i) => [k, values[i]]));
}

export async function setSetting(key, value, adminId) {
  if (!(key in SETTING_DEFAULTS)) {
    throw new Error(`Unknown setting key: ${key}`);
  }
  await pool.query(
    `
    INSERT INTO platform_settings (key, value, updated_by, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (key) DO UPDATE SET value = $2, updated_by = $3, updated_at = NOW()
    `,
    [key, JSON.stringify(value), adminId],
  );
}