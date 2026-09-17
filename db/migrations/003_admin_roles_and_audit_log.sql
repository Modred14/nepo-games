-- MIGRATION: db/migrations/003_admin_roles_and_audit_log.sql
--
-- Phase 1 of the admin dashboard build. Two new tables:
--
--   admins            -- tracks admin TIER (admin vs super_admin) for
--                         each admin user, separate from users.role.
--   admin_audit_log   -- immutable record of every sensitive admin action.
--
-- IMPORTANT: this does NOT touch users.role or change how requireAdmin()
-- gates access. Every existing admin (users.role = 'admin') keeps working
-- exactly as before, with zero downtime and zero risk of lockout. The
-- `admins` table is purely additive — it records which TIER each admin
-- is (for Phase 2's granular permissions, and so the audit log can show
-- which admin did something), but no row needs to exist here for an
-- admin to keep using requireAdmin()-gated routes: src/lib/auth.js
-- auto-creates a default 'admin'-tier row the first time an admin
-- without one hits any admin route, and fails open (defaults to 'admin'
-- tier rather than blocking) if this table isn't reachable at all.
--
-- This migration backfills a row for every CURRENT admin so the table
-- isn't empty on day one. Every backfilled admin gets the 'admin' tier,
-- not 'super_admin' — nobody gets new capabilities they didn't already
-- have. See the bottom of this file for how to promote yourself (the
-- site owner) to 'super_admin' by hand — there's deliberately no
-- automated way to guess who "the owner" is.

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  admin_role VARCHAR(20) NOT NULL DEFAULT 'admin'
    CHECK (admin_role IN ('admin', 'super_admin')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  disabled_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Nullable and NOT a hard FK-with-cascade-delete on purpose: if an
  -- admin account is ever deleted, their past audit history must not
  -- disappear or block the deletion.
  admin_id INTEGER,
  action VARCHAR(100) NOT NULL,        -- e.g. 'dispute.resolve', 'withdrawal.recheck'
  resource_type VARCHAR(50),           -- e.g. 'transaction', 'withdrawal', 'user'
  resource_id VARCHAR(100),            -- text: resource ids come from different tables/types
  previous_value JSONB,
  new_value JSONB,
  reason TEXT,
  ip_address VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_resource ON admin_audit_log (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log (created_at DESC);

-- Backfill: give every existing admin an 'admin'-tier row.
INSERT INTO admins (user_id, admin_role, created_at)
SELECT id, 'admin', NOW()
FROM users
WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- MANUAL STEP FOR YOU (the site owner) — NOT run automatically:
-- promote yourself to super_admin once you know your own user id.
--
--   SELECT id, email FROM users WHERE email = 'your-email@example.com';
--   UPDATE admins SET admin_role = 'super_admin' WHERE user_id = <your id>;
--
-- Nothing currently checks for super_admin specifically (that gating
-- arrives in a later phase, alongside an actual admin-management UI),
-- so this step isn't urgent — do it whenever you want to be ready ahead
-- of that phase.
-- ─────────────────────────────────────────────────────────────────