// ROUTE: src/app/api/admin/users/[id]/role/route.js  (NEW)
//
// ADMIN DASHBOARD PHASE 2: change a user's role (user <-> admin).
// Gated behind requireSuperAdmin(), NOT requireAdmin() — granting admin
// access is exactly the kind of privilege-escalation-risk action the
// original spec calls out explicitly ("Prevent privilege escalation",
// "A moderator should NOT automatically have financial permissions").
// An 'admin'-tier admin can suspend/ban users (see the status route)
// but cannot create new admins.
import pool from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminAudit";

const VALID_ROLES = ["user", "admin"];

export async function POST(req, { params }) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) {
      return Response.json(
        { error: "Only a super admin can change user roles" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const { role, reason } = await req.json();

    if (!VALID_ROLES.includes(role)) {
      return Response.json(
        { error: `role must be one of: ${VALID_ROLES.join(", ")}` },
        { status: 400 },
      );
    }

    if (Number(id) === Number(admin.id)) {
      return Response.json(
        { error: "You cannot change your own role" },
        { status: 400 },
      );
    }

    const targetRes = await pool.query(
      `SELECT id, email, role FROM users WHERE id = $1`,
      [id],
    );
    const target = targetRes.rows[0];
    if (!target) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (target.role === role) {
      return Response.json({ user: target, unchanged: true });
    }

    const updated = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role`,
      [role, id],
    );

    // If promoting to admin, give them a Phase-1 `admins` row too (default
    // 'admin' tier — never auto-granted 'super_admin') so they show up
    // consistently everywhere the admins table is read, immediately
    // rather than lazily on their first admin-route hit.
    if (role === "admin") {
      await pool.query(
        `INSERT INTO admins (user_id, admin_role, created_by)
         VALUES ($1, 'admin', $2)
         ON CONFLICT (user_id) DO NOTHING`,
        [id, admin.id],
      );
    }

    logAdminAction({
      admin,
      action: `user.role.${role}`,
      resourceType: "user",
      resourceId: id,
      previousValue: { role: target.role },
      newValue: { role },
      reason: reason || null,
      req,
    });

    return Response.json({ user: updated.rows[0] });
  } catch (err) {
    console.error("ADMIN USER ROLE CHANGE ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}