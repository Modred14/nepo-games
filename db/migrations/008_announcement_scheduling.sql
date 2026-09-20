-- MIGRATION: db/migrations/008_announcement_scheduling.sql
--
-- ADMIN DASHBOARD PHASE 5: system_messages currently has no way to
-- disable, schedule, or categorize a message — every row ever inserted
-- is shown to every logged-in user forever (verified in
-- src/app/api/system-messages/route.js, the user-facing fetch: no
-- enabled/date filtering exists there at all). This adds exactly that,
-- defaulting every EXISTING row to enabled/no-schedule/type 'info' so
-- nothing already sent changes behavior.

ALTER TABLE system_messages
  ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'info'
    CHECK (type IN ('info', 'warning', 'promo', 'maintenance')),
  ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_system_messages_enabled ON system_messages (enabled);
