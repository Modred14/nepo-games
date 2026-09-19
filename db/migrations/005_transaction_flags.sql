-- MIGRATION: db/migrations/005_transaction_flags.sql
--
-- ADMIN DASHBOARD PHASE 3: two independent, non-financial flags on
-- `transactions`, both purely additive (default to "off" for every
-- existing row, nothing changes until an admin uses them):
--
--   flagged_for_review  -- "mark transaction for review" from the spec.
--                           Cosmetic/organizational only — does not
--                           block or change any automated flow.
--
--   frozen              -- actually enforced (see the release-escrow
--                           cron and the buyer confirm route in this
--                           same delivery): a frozen transaction is
--                           skipped by the auto-release cron and the
--                           buyer cannot confirm/release it themselves
--                           while frozen. This is what makes "freeze"
--                           a real safeguard rather than a label.

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flagged_reason TEXT,
  ADD COLUMN IF NOT EXISTS flagged_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS frozen BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS frozen_reason TEXT,
  ADD COLUMN IF NOT EXISTS frozen_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_transactions_flagged ON transactions (flagged_for_review) WHERE flagged_for_review = true;
CREATE INDEX IF NOT EXISTS idx_transactions_frozen ON transactions (frozen) WHERE frozen = true;
