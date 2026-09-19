-- MIGRATION: db/migrations/004_user_account_status_and_last_login.sql
--
-- ADMIN DASHBOARD PHASE 2: two new columns on `users`, needed for two
-- things the site owner asked for explicitly:
--
--   account_status  -- 'active' | 'suspended' | 'banned', defaults to
--                       'active' so every existing user is unaffected.
--                       Actually enforced (not just a UI label) — see
--                       src/lib/auth.js and the NextAuth route changes
--                       in this same delivery: a suspended/banned user
--                       is blocked from logging in AND from any already-
--                       logged-in authenticated request going forward.
--
--   last_login_at   -- updated on every successful login (both Google
--                       and credentials). Backs the "Active users"
--                       dashboard metric, defined as: logged in within
--                       the last 30 days. NULL for anyone who hasn't
--                       logged in since this column was added — that's
--                       expected, not a bug, for existing accounts until
--                       their next login.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended', 'banned'));

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_account_status ON users (account_status);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users (last_login_at);
