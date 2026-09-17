// src/lib/adminAudit.js  (NEW)
//
// ADMIN DASHBOARD PHASE 1: shared helper for writing to admin_audit_log
// (see db/migrations/003_admin_roles_and_audit_log.sql). Every admin
// route that changes something sensitive should call this after the
// change succeeds — see src/app/api/admin/disputes/resolve/route.js and
// src/app/api/admin/withdrawals/[id]/recheck/route.js for the pattern.
//
// Deliberately never throws: a logging failure must not be able to break
// or roll back the actual admin action it's recording. If the insert
// fails, it's logged to console and swallowed.
import pool from "./db";

export async function logAdminAction({
  admin, // the object returned by requireAdmin() — needs at least `.id`
  action, // short machine-readable string, e.g. 'dispute.resolve'
  resourceType, // e.g. 'transaction', 'withdrawal', 'user'
  resourceId,
  previousValue,
  newValue,
  reason,
  req, // optional: the incoming Request/NextRequest, used for IP capture
}) {
  try {
    const ip = extractIp(req);

    await pool.query(
      `
      INSERT INTO admin_audit_log
        (admin_id, action, resource_type, resource_id, previous_value, new_value, reason, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        admin?.id ?? null,
        action,
        resourceType ?? null,
        resourceId != null ? String(resourceId) : null,
        previousValue != null ? JSON.stringify(previousValue) : null,
        newValue != null ? JSON.stringify(newValue) : null,
        reason ?? null,
        ip,
      ],
    );
  } catch (err) {
    console.error("logAdminAction failed:", err.message, {
      action,
      resourceType,
      resourceId,
    });
  }
}

function extractIp(req) {
  if (!req) return null;
  try {
    // Works for both the Fetch-API Request (App Router route handlers
    // get `req.headers.get(...)`) — Netlify/most proxies set
    // x-forwarded-for; x-real-ip is a fallback some setups use instead.
    const forwarded = req.headers?.get?.("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();

    const real = req.headers?.get?.("x-real-ip");
    if (real) return real;
  } catch {
    // headers.get not available for some reason — don't let IP capture
    // break the actual audit log write.
  }
  return null;
}