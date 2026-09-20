// ROUTE: src/app/api/admin/admins/[userId]/tier/route.js  (NEW)
//
// ADMIN DASHBOARD PHASE 6: promote/demote between 'admin' and
// 'super_admin' TIER — distinct from src/app/api/admin/users/[id]/role/route.js,
// which handles the user<->admin GATE (users.role). This only applies to
// someone who's already an admin. Gated to requireSuperAdmin() and rate
// limited — this is the single most sensitive action in the whole
// dashboard (a super_admin can do everything, including create more
// super_admins), so it gets both protections rather than just one.
import pool from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminAudit";
import { checkRateLimit } from "@/lib/rateLimit";
import { verifyReauthToken } from "@/lib/reauth";

const VALID_TIERS = ["admin", "super_admin"];

export async function POST(req, { params }) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) {
      return Response.json({ error: "Only a super admin can change admin tiers" }, { status: 403 });
    }

    const rl = await checkRateLimit(`admin-tier-change:${admin.id}`, { limit: 5, windowSeconds: 300 });
    if (!rl.allowed) {
      return Response.json(
        { error: "Too many tier changes in a short time. Wait a few minutes and try again." },
        { status: 429 },
      );
    }

    const { userId } = await params;
    const { adminRole, reason } = await req.json();

    if (!VALID_TIERS.includes(adminRole)) {
      return Response.json({ error: `adminRole must be one of: ${VALID_TIERS.join(", ")}` }, { status: 400 });
    }

    if (Number(userId) === Number(admin.id)) {
      return Response.json({ error: "You cannot change your own tier" }, { status: 400 });
    }

    // ADMIN DASHBOARD: re-auth required specifically for GRANTING
    // super_admin — that's the actual privilege-escalation direction.
    // Demoting a super_admin down to admin reduces privilege, so it
    // doesn't need the same bar (and requiring it there would just be
    // friction with no security benefit).
    if (
      adminRole === "super_admin" &&
      !verifyReauthToken(req, { adminId: admin.id, action: "admin.tier.super_admin" })
    ) {
      return Response.json(
        { error: "Re-authentication required or expired. Please confirm your password/PIN and try again." },
        { status: 401 },
      );
    }

    const existing = await pool.query(
      `SELECT id, admin_role FROM admins WHERE user_id = $1 AND disabled_at IS NULL`,
      [userId],
    );
    if (!existing.rows[0]) {
      return Response.json({ error: "This user is not an active admin" }, { status: 404 });
    }

    const updated = await pool.query(
      `UPDATE admins SET admin_role = $1 WHERE user_id = $2 RETURNING id, admin_role`,
      [adminRole, userId],
    );

    logAdminAction({
      admin,
      action: `admin.tier.${adminRole}`,
      resourceType: "admin",
      resourceId: userId,
      previousValue: { admin_role: existing.rows[0].admin_role },
      newValue: { admin_role: adminRole },
      reason: reason || null,
      req,
    });

    return Response.json({ admin: updated.rows[0] });
  } catch (err) {
    console.error("ADMIN TIER CHANGE ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}