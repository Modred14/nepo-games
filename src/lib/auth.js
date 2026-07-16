// src/lib/auth.js
import { getServerSession } from "next-auth";
import { authOptions } from "../app/api/auth/[...nextauth]/route";
import pool from "./db";

export async function requireUser() {
  const session = await getServerSession(authOptions);
 
  if (!session?.user?.id) return null;
 
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
export async function requireAdmin() {
  const user = await requireUser();
  if (!user) return null;

  const result = await pool.query(`SELECT role FROM users WHERE id = $1`, [
    user.id,
  ]);

  if (result.rows[0]?.role !== "admin") return null;

  return user;
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