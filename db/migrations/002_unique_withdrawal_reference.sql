-- MIGRATION: db/migrations/002_unique_withdrawal_reference.sql
--
-- AUDIT FIX (D.6, defense in depth): src/app/api/user/withdraw/route.js
-- generates `reference = WD_${Date.now()}_${userId}` and, combined with a
-- SELECT ... FOR UPDATE row lock on the user during the whole withdrawal
-- transaction, a real collision is already effectively impossible. This
-- migration closes the gap at the database level too, and backs the new
-- `ON CONFLICT (reference) DO NOTHING` in the withdrawal insert (which
-- would silently no-op instead of enforcing anything without this
-- constraint in place).
--
-- No repo-tracked schema/migration files existed prior to this audit —
-- this table lives only in the live database — so run this by hand
-- against your Postgres instance (or wire it into whatever migration
-- runner you use) before deploying the updated withdraw/route.js.
--
-- Safe to run on an existing table: will fail loudly (not silently) if
-- duplicate references already exist, which is itself worth knowing
-- about before adding the constraint.

ALTER TABLE users_transactions
  ADD CONSTRAINT users_transactions_reference_key UNIQUE (reference);