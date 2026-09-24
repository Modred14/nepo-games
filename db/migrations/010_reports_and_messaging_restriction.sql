-- MIGRATION: db/migrations/010_reports_and_messaging_restriction.sql
--
-- ADMIN DASHBOARD: chat/message moderation (Section 13 of the original
-- spec). Two things needed that didn't exist at all before this:
--
--   reports               -- there IS a "Report" button on the public
--                             listing page (src/app/game/[slug]/GameClient.jsx,
--                             confirmReport()), but it only sets local UI
--                             state and shows a toast — it never calls any
--                             API or persists anything anywhere. Users
--                             believe they've reported a seller and
--                             nothing happens. This table is the actual
--                             backend for that button (now wired up in
--                             this same delivery, see
--                             src/app/api/report/route.js), and it's also
--                             what "investigate reported conversations"
--                             needed to have any real data to investigate.
--
--   users.messaging_restricted  -- lets an admin actually stop a user
--                                   from sending new chat messages,
--                                   enforced in the real message-send
--                                   routes (src/app/api/c/[slug]/send/route.js
--                                   and .../messages/route.js).

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reporter_id INTEGER NOT NULL REFERENCES users(id),
  reported_user_id INTEGER NOT NULL REFERENCES users(id),
  listing_id INTEGER REFERENCES listings(id),
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports (reported_user_id);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS messaging_restricted BOOLEAN NOT NULL DEFAULT false;
