-- MIGRATION: db/migrations/007_listing_moderation.sql
--
-- ADMIN DASHBOARD PHASE 4: listing moderation. There is currently NO
-- moderation workflow anywhere in the codebase (verified via audit) —
-- `listings.status` cycles between 'active' / 'pending' / 'processing'
-- purely as part of the checkout flow (locking a listing while a
-- purchase is in progress), not as an approval/moderation mechanism.
--
-- Rather than overload that existing status column (which risks
-- colliding with the checkout state machine — see
-- src/app/api/paystack/buy/initialize/route.js, which toggles a listing
-- between exactly those three values), moderation gets its own
-- independent column:
--
--   moderation_status  -- 'approved' (default — every existing listing
--                          keeps behaving exactly as it does today) |
--                          'hidden' | 'rejected'
--   featured            -- boolean, for the "feature/unfeature" action
--
-- Enforcement: src/app/api/market/route.js (public search) and
-- src/app/api/paystack/buy/initialize/route.js (purchase) are both
-- updated in this same delivery to also require moderation_status =
-- 'approved' — a hidden/rejected listing disappears from search AND
-- can't be bought, not just one or the other.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) NOT NULL DEFAULT 'approved'
    CHECK (moderation_status IN ('approved', 'hidden', 'rejected')),
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS moderated_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_listings_moderation_status ON listings (moderation_status);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings (featured) WHERE featured = true;
