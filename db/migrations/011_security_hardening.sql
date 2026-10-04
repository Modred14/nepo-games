-- ROUTE: db/migrations/011_security_hardening.sql
-- 011_security_hardening.sql
-- Run once: npm run db:migrate (or psql -f). Safe to re-run (IF NOT EXISTS).
-- NOTE: the earlier migrations in this folder are incremental; the BASE schema
-- (users, listings, transactions, ...) is not in the repository. Export it
-- from Neon (pg_dump --schema-only) and commit it so the DB can be rebuilt.

-- OTP brute-force counter (used by /api/verify-otp and /api/verify-email-otp)
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_attempts integer NOT NULL DEFAULT 0;

-- A reset token / email-verification token must be unique and fast to look up.
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users (reset_token) WHERE reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users (verification_token) WHERE verification_token IS NOT NULL;

-- Hot lookup paths used by the chat / escrow routes.
CREATE INDEX IF NOT EXISTS idx_conversations_listing ON conversations (listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_listing_buyer ON transactions (listing_id, buyer_id);
CREATE INDEX IF NOT EXISTS idx_login_deliveries_conversation ON login_deliveries (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_transactions_user_ref ON users_transactions (user_id, reference);

-- ONE open order per listing at a time: a second live (pending-payment or
-- paid-and-held) transaction for the same listing is a double sale. This
-- partial unique index makes the database itself refuse it, regardless of
-- application bugs or races.
-- If this fails with "could not create unique index", you already have
-- duplicate live orders: resolve them first (see scripts/diagnose-*).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_live_transaction_per_listing
  ON transactions (listing_id)
  WHERE (payment_status = 'pending' AND transaction_status = 'initiated')
     OR (payment_status = 'paid' AND escrow_status IN ('holding', 'frozen'));

-- One payment reference == one order.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_transactions_payment_reference
  ON transactions (payment_reference) WHERE payment_reference IS NOT NULL;

-- One delivery per conversation (matches the application check).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_login_delivery_per_conversation
  ON login_deliveries (conversation_id);

-- Prices/amounts must be positive.
DO $$ BEGIN
  ALTER TABLE transactions ADD CONSTRAINT chk_transactions_amount_positive CHECK (amount > 0) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE users_transactions ADD CONSTRAINT chk_users_transactions_amount_nonneg CHECK (amount >= 0) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
