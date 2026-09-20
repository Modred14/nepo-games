// ROUTE: src/app/api/admin/admins/route.js  (NEW)
//
// ADMIN DASHBOARD PHASE 6: admin management. Gated to requireSuperAdmin()
// entirely — not just the mutating actions — per the original spec's
// framing of this whole area as a Super Admin capability ("Super Admin
// should be able to... view admin activity"). A regular 'admin'-tier
// admin can't see who the other admins are from here, let alone change
// anything.
import pool from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return Response.json({ error: "Only a super admin can view admin management" }, { status: 403 });
  }

  const result = await pool.query(
    `
    SELECT
      a.id AS admin_row_id, a.admin_role, a.created_at AS admin_since, a.disabled_at,
      u.id AS user_id, u.email, u.username, u.first_name, u.surname, u.account_status,
      creator.email AS created_by_email
    FROM admins a
    JOIN users u ON u.id = a.user_id
    LEFT JOIN users creator ON creator.id = a.created_by
    ORDER BY a.disabled_at NULLS FIRST, a.created_at ASC
    `,
  );

  return Response.json({ admins: result.rows });
}