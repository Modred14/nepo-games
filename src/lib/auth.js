// src/lib/auth.js
import { getServerSession } from "next-auth";
import { authOptions } from "../app/api/auth/[...nextauth]/route";
import pool from "./db";

// ADMIN DASHBOARD PHASE 2: now also enforces users.account_status
// (see db/migrations/004_user_account_status_and_last_login.sql).
// Deliberately checked HERE rather than only at login time: this
// codebase already documents (see the note on the jwt() callback in
// [...nextauth]/route.js) that role/plan/etc. can be stale in the JWT
// for up to 7 days. Suspending someone should not have to wait up to a
// week to take effect. requireUser() is called from ~40 routes across
// the app, so checking here — one cheap, primary-key-indexed lookup —
// is what actually makes suspend/ban work on a user's very next request,
// not just their next login.
//
// Fails OPEN on the lookup itself (not on the suspension check) — if
// account_status can't be read for any reason (e.g. this migration
// hasn't been run yet in a given environment), this behaves exactly as
// it did before this change: nobody gets logged out over infrastructure
// trouble, and a genuinely suspended/banned user still gets caught the
// next time the query succeeds.
export async function requireUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return null;

  try {
    const result = await pool.query(
      `SELECT account_status FROM users WHERE id = $1`,
      [session.user.id],
    );
    const status = result.rows[0]?.account_status;
    if (status === "suspended" || status === "banned") return null;
  } catch (err) {
    console.error(
      "requireUser: account_status lookup failed, failing open:",
      err.message,
    );
  }

  return session.user;
}

// FIX (stale privileges): role lives on the JWT for up to 7 days, so a
// revoked admin would keep passing `user.role === "admin"` checks until
// they logged out and back in. Rather than refreshing the role on every
// request app-wide (expensive, and unreliable — see the note in
// [...nextauth]/route.js), admin-gated routes should use this instead of
// trusting session.user.role directly. It does one extra DB read, but only
// on the (rare, relative to total traffic) actions that actually need
// admin authorization.
//
// ADMIN DASHBOARD PHASE 1: this now also attaches `adminId` (the row id
// in the new `admins` table) and `adminRole` ('admin' | 'super_admin',
// see db/migrations/003_admin_roles_and_audit_log.sql) to the returned
// user. The actual admin GATE below is UNCHANGED — it still checks only
// `users.role === 'admin'`, exactly as before, so every existing admin
// keeps working with zero risk of lockout, migration-run or not. The
// admins-table lookup is best-effort on top of that: if the table
// doesn't exist yet in a given environment, or the lookup fails for any
// reason, this fails OPEN to a default 'admin' tier rather than denying
// access — a broken/missing admins table must never be able to lock a
// real admin out.
export async function requireAdmin() {
  const user = await requireUser();
  if (!user) return null;

  const result = await pool.query(`SELECT role FROM users WHERE id = $1`, [
    user.id,
  ]);

  if (result.rows[0]?.role !== "admin") return null;

  let adminRow;
  try {
    const adminRes = await pool.query(
      `SELECT id, admin_role FROM admins WHERE user_id = $1`,
      [user.id],
    );
    adminRow = adminRes.rows[0];

    if (!adminRow) {
      // Admin exists (users.role='admin') but has no row in the new
      // table yet — e.g. created after the migration ran, or the
      // migration hasn't been run in this environment at all. Auto
      // provision a default 'admin'-tier row rather than requiring a
      // manual backfill for every future admin.
      const inserted = await pool.query(
        `INSERT INTO admins (user_id, admin_role)
         VALUES ($1, 'admin')
         ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
         RETURNING id, admin_role`,
        [user.id],
      );
      adminRow = inserted.rows[0];
    }
  } catch (err) {
    console.error(
      "requireAdmin: admins table lookup/provision failed, defaulting to 'admin' tier:",
      err.message,
    );
    adminRow = { id: null, admin_role: "admin" };
  }

  return { ...user, adminId: adminRow.id, adminRole: adminRow.admin_role };
}

// ADMIN DASHBOARD PHASE 1: for actions that should be restricted to
// super_admin specifically. Nothing uses this yet (admin-management UI —
// creating/disabling other admins, changing tiers — is a later phase),
// but it's here now so that phase doesn't need another auth.js change.
export async function requireSuperAdmin() {
  const admin = await requireAdmin();
  if (!admin) return null;
  if (admin.adminRole !== "super_admin") return null;
  return admin;
}

// FIX: this previously did `throw Response.json(...)`, i.e. threw a plain
// Response object instead of an Error. A `catch (err)` block anywhere that
// expects normal Error semantics (err.message, instanceof Error, logging
// libraries, etc.) would behave unpredictably against a Response. Throw a
// real Error instead; callers that want an HTTP response should catch this
// and build the Response themselves, e.g.:
//   try { const user = await requireUserOrThrow(); }
//   catch (err) { return Response.json({ error: err.message }, { status: 401 }); }
export async function requireUserOrThrow() {
  const user = await requireUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}