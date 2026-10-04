// ROUTE: src/lib/settings.js
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
  // General/marketplace settings — see db/migrations/009_general_settings.sql.
  // maintenance_mode/marketplace_enabled are checked in the actual
  // Node-runtime route handlers that matter (market/route.js,
  // paystack/buy/initialize/route.js, listings/route.js) rather than in
  // root middleware.js, which runs on the Edge runtime by default and
  // cannot reliably use the `pg` Postgres client — a maintenance-mode
  // check that failed there could lock the whole site (including
  // /admin) behind a broken Edge function. Checking it in a handful of
  // specific Node-runtime routes instead is slightly less "site-wide"
  // but can never lock anyone out of /admin to turn it back off.
  maintenance_mode: false,
  marketplace_enabled: true,
  new_listings_enabled: true,
  min_listing_price: 100,
  max_listing_price: 50000000,
  site_name: "Nepogames",
  support_email: "",
};

// Short in-process cache: getSetting is called on hot paths (every listing
// create / checkout) and each call was a database round trip. 10 seconds keeps
// admin changes effectively immediate while removing most of that load.
const SETTINGS_TTL_MS = 10_000;
const settingsCache = new Map();

export async function getSetting(key) {
  const hit = settingsCache.get(key);
  if (hit && Date.now() - hit.at < SETTINGS_TTL_MS) return hit.value;
  const value = await readSetting(key);
  settingsCache.set(key, { value, at: Date.now() });
  return value;
}

async function readSetting(key) {
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

// Server-side validation for every platform setting. These values drive
// money (seller fee, withdrawal fees, price limits) and availability, so a
// typo or a hostile admin request must not be able to store e.g. a negative
// fee, a 1000% fee, or a string where a number is expected.
const NUM = (min, max) => (v) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const BOOL = (v) => typeof v === "boolean";
const STR = (max) => (v) => typeof v === "string" && v.length <= max;
const SETTING_VALIDATORS = {
  seller_fee_percent: NUM(0, 30),
  escrow_window_minutes: NUM(1, 7 * 24 * 60),
  minimum_withdrawal_naira: NUM(0, 1_000_000),
  withdrawal_fee_tiers: (v) =>
    v && typeof v === "object" && !Array.isArray(v) &&
    ["tier1_max", "tier1_fee", "tier2_max", "tier2_fee", "tier3_fee"].every((k) => NUM(0, 10_000_000)(v[k])) &&
    v.tier1_max < v.tier2_max,
  maintenance_mode: BOOL,
  marketplace_enabled: BOOL,
  new_listings_enabled: BOOL,
  min_listing_price: NUM(1, 1_000_000_000),
  max_listing_price: NUM(1, 1_000_000_000),
  site_name: STR(60),
  support_email: (v) => typeof v === "string" && (v === "" || /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(v)) && v.length <= 254,
};

// The admin UI's <input type="number"> hands back strings ("5"); convert
// numeric strings to numbers (also inside the withdrawal-fee tiers object)
// BEFORE validating. Anything non-numeric stays as-is and fails validation.
export function coerceSetting(key, value) {
  const toNum = (v) =>
    typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : v;
  if (key === "withdrawal_fee_tiers" && value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toNum(v)]));
  }
  const numericKeys = [
    "seller_fee_percent", "escrow_window_minutes", "minimum_withdrawal_naira",
    "min_listing_price", "max_listing_price",
  ];
  return numericKeys.includes(key) ? toNum(value) : value;
}

export function isValidSetting(key, value) {
  const check = SETTING_VALIDATORS[key];
  return !!check && check(value);
}

export async function setSetting(key, value, adminId) {
  if (!Object.prototype.hasOwnProperty.call(SETTING_DEFAULTS, key)) {
    throw new Error(`Unknown setting key: ${key}`);
  }
  if (!isValidSetting(key, value)) {
    throw new Error(`Invalid value for setting: ${key}`);
  }
  await pool.query(
    `
    INSERT INTO platform_settings (key, value, updated_by, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (key) DO UPDATE SET value = $2, updated_by = $3, updated_at = NOW()
    `,
    [key, JSON.stringify(value), adminId],
  );
  settingsCache.delete(key);
}
