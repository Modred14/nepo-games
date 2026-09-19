-- MIGRATION: db/migrations/006_platform_settings.sql
--
-- ADMIN DASHBOARD PHASE 4: platform_settings — makes previously hardcoded
-- business values admin-editable (Section 10 of the original spec).
-- Seeded with values that EXACTLY match the current hardcoded behavior,
-- so applying this migration changes nothing on its own — an admin has
-- to actively edit a value from /admin/settings for behavior to change.
--
-- Values pulled from the actual code (verified, not guessed):
--   seller_fee_percent      <- `amount * 0.05` in buy/initialize and webhook
--   escrow_window_minutes   <- DELIVERY_WINDOW_MS = 30*60*1000 in senddetails
--   minimum_withdrawal_naira<- `amount < 100` in withdraw/route.js
--   withdrawal_fee_tiers    <- calculateWithdrawalFee() in withdraw/route.js

CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_settings (key, value) VALUES
  ('seller_fee_percent', '5'),
  ('escrow_window_minutes', '30'),
  ('minimum_withdrawal_naira', '100'),
  ('withdrawal_fee_tiers', '{"tier1_max": 5000, "tier1_fee": 50, "tier2_max": 50000, "tier2_fee": 100, "tier3_fee": 150}')
ON CONFLICT (key) DO NOTHING;
