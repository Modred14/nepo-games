// ROUTE: src/app/api/admin/users/[id]/status/route.js  (NEW)
//
// ADMIN DASHBOARD PHASE 2: change a user's account_status
// (active/suspended/banned). Enforcement itself lives in
// src/lib/auth.js's requireUser() and the NextAuth login callbacks —
// this route only changes the value and records why.
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminAudit";

const VALID_STATUSES = ["active", "suspended", "banned"];

export async function POST(req, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { status, reason } = await req.json();

    if (!VALID_STATUSES.includes(status)) {
      return Response.json(
        { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }

    // An admin locking themselves out is a real support headache and an
    // easy accidental click to make — block it outright.
    if (Number(id) === Number(admin.id)) {
      return Response.json(
        { error: "You cannot change your own account status" },
        { status: 400 },
      );
    }

    const targetRes = await pool.query(
      `SELECT id, email, role, account_status FROM users WHERE id = $1`,
      [id],
    );
    const target = targetRes.rows[0];
    if (!target) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (target.account_status === status) {
      return Response.json({ user: target, unchanged: true });
    }

    const updated = await pool.query(
      `UPDATE users SET account_status = $1 WHERE id = $2
       RETURNING id, email, role, account_status`,
      [status, id],
    );

    logAdminAction({
      admin,
      action: `user.account_status.${status}`,
      resourceType: "user",
      resourceId: id,
      previousValue: { account_status: target.account_status },
      newValue: { account_status: status },
      reason: reason || null,
      req,
    });

    return Response.json({ user: updated.rows[0] });
  } catch (err) {
    console.error("ADMIN USER STATUS CHANGE ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}