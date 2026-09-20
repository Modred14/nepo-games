-- MIGRATION: db/migrations/009_general_settings.sql
--
-- ADMIN DASHBOARD: general/marketplace settings — the rest of Section 10
-- of the original spec, beyond the financial values already wired up in
-- 006_platform_settings.sql. None of these existed as concepts anywhere
-- in the codebase before this (verified — no maintenance mode, no
-- marketplace-enabled flag, no configurable listing price bounds).
--
-- Seeded so nothing changes behavior on its own:
--   marketplace_enabled = true, new_listings_enabled = true,
--   maintenance_mode = false — the site keeps working exactly as before
--   until an admin actively flips one of these.
--   min_listing_price = 100, max_listing_price = 50000000 — matches the
--   MAX_LISTING_PRICE sanity cap that was hardcoded in
--   src/app/api/listings/route.js (₦50,000,000) and a reasonable floor
--   above ₦0 (the only check that existed before).

INSERT INTO platform_settings (key, value) VALUES
  ('maintenance_mode', 'false'),
  ('marketplace_enabled', 'true'),
  ('new_listings_enabled', 'true'),
  ('min_listing_price', '100'),
  ('max_listing_price', '50000000'),
  ('site_name', '"Nepo Games"'),
  ('support_email', '""')
ON CONFLICT (key) DO NOTHING;
