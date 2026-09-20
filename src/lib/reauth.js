// src/lib/reauth.js  (NEW)
//
// ADMIN DASHBOARD: step-up re-authentication for the most sensitive
// admin actions (Section 2 of the original spec: "Re-authentication/
// confirmation for extremely sensitive operations" — everything built
// so far only did confirmation via window.confirm/prompt, not actual
// re-auth). Mirrors the exact JWT pattern already used for socket join
// tokens in src/lib/socketAuth.js, signed with NEXTAUTH_SECRET (the
// app's existing auth-signing secret) rather than inventing a new one.
//
// Flow: admin enters their password (or PIN, for Google-only accounts
// with no password_hash — see requireReauthCredential below) ->
// POST /api/admin/reauth verifies it and returns a short-lived token ->
// the client includes that token as `x-reauth-token` on the actual
// sensitive request -> the route calls verifyReauthToken() and checks
// it matches the acting admin AND was issued for this specific action,
// not just "any" reauth (a token minted for a tier-change confirmation
// isn't valid for authorizing a fund release, and vice versa).
import jwt from "jsonwebtoken";

const SECRET = process.env.NEXTAUTH_SECRET;
const TOKEN_TTL_SECONDS = 5 * 60; // 5 minutes — short on purpose

export function signReauthToken({ adminId, action }) {
  if (!SECRET) throw new Error("NEXTAUTH_SECRET is not set");
  return jwt.sign({ adminId, action, purpose: "admin-reauth" }, SECRET, {
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

// Verifies the token from the `x-reauth-token` header matches the
// CURRENT admin and was issued for THIS specific action. Returns true/
// false rather than throwing, so callers can return a clean 401.
export function verifyReauthToken(req, { adminId, action }) {
  const token = req.headers?.get?.("x-reauth-token");
  if (!token || !SECRET) return false;

  try {
    const payload = jwt.verify(token, SECRET);
    return (
      payload.purpose === "admin-reauth" &&
      payload.action === action &&
      Number(payload.adminId) === Number(adminId)
    );
  } catch {
    return false; // expired, tampered, or malformed
  }
}