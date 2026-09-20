// ROUTE: src/app/api/admin/reauth/route.js  (NEW)
//
// ADMIN DASHBOARD: verifies the admin's own credential (password, or PIN
// as a fallback — see below) before issuing a short-lived step-up token
// (src/lib/reauth.js) that a sensitive action then requires. This is the
// actual "re-authentication" the original spec asked for, distinct from
// the confirm()/reason-prompt pattern used everywhere else in the
// dashboard, which is confirmation, not re-auth — anyone with an open
// browser tab could click through a confirm() dialog; re-auth requires
// proving you're still the person who owns the session.
//
// Credential fallback: Google-only admin accounts have password_hash =
// NULL (see the comment in src/app/api/auth/[...nextauth]/route.js) —
// there's no password to check. Rather than silently skipping
// re-auth for them (which would make step-up protection weaker for
// exactly the accounts that might be easiest to session-hijack via a
// shared Google session), they fall back to their withdrawal PIN
// (pin_hash) if they've set one. If neither exists, the action is
// blocked with a clear message instead of silently allowing it through
// unauthenticated-a-second-time.
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { signReauthToken } from "@/lib/reauth";
import { checkRateLimit } from "@/lib/rateLimit";
import bcrypt from "bcrypt";

const VALID_ACTIONS = ["transaction.resolve", "admin.tier.super_admin"];

export async function POST(req) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Re-auth attempts are exactly the kind of thing worth throttling
    // hard — this is effectively a login form for an already-privileged
    // account, so brute-forcing the password/PIN here matters more than
    // most other admin routes.
    const rl = await checkRateLimit(`admin-reauth:${admin.id}`, { limit: 5, windowSeconds: 300 });
    if (!rl.allowed) {
      return Response.json(
        { error: "Too many re-authentication attempts. Wait a few minutes and try again." },
        { status: 429 },
      );
    }

    const { credential, action } = await req.json();

    if (!VALID_ACTIONS.includes(action)) {
      return Response.json({ error: "Unknown action" }, { status: 400 });
    }
    if (!credential) {
      return Response.json({ error: "Password or PIN required" }, { status: 400 });
    }

    const userRes = await pool.query(
      `SELECT password_hash, pin_hash FROM users WHERE id = $1`,
      [admin.id],
    );
    const user = userRes.rows[0];
    if (!user) {
      return Response.json({ error: "Account not found" }, { status: 404 });
    }

    let verified = false;
    let credentialType = null;

    if (user.password_hash) {
      verified = await bcrypt.compare(credential, user.password_hash);
      credentialType = "password";
    } else if (user.pin_hash) {
      verified = await bcrypt.compare(credential, user.pin_hash);
      credentialType = "PIN";
    } else {
      return Response.json(
        {
          error:
            "No password or withdrawal PIN is set on your account, so re-authentication isn't possible yet. Set a PIN from your profile first.",
        },
        { status: 400 },
      );
    }

    if (!verified) {
      return Response.json(
        { error: `Incorrect ${credentialType}` },
        { status: 401 },
      );
    }

    const token = signReauthToken({ adminId: admin.id, action });
    return Response.json({ token, expiresInSeconds: 300 });
  } catch (err) {
    console.error("ADMIN REAUTH ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}