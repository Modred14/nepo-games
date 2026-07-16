// src/app/api/admin/system-messages/route.js
import pool from "../../../../lib/db";
import { requireUser, requireAdmin } from "@/lib/auth";

export async function POST(req) {
  try {
    // FIX: this previously called requireUser() without importing it at
    // all, so every request to this route threw "requireUser is not
    // defined" and 500'd.
    const user = await requireUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // FIX: switched from trusting session.user.role (can be stale for up
    // to 7 days if an admin's role was revoked) to requireAdmin(), which
    // re-verifies the role straight from the DB at the point of use.
    const admin = await requireAdmin();
    if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { title, message } = await req.json();

    if (!message) {
      return Response.json({ error: "Message required" }, { status: 400 });
    }

    const result = await pool.query(
      `
      INSERT INTO system_messages (title, message)
      VALUES ($1, $2)
      RETURNING *
      `,
      [title, message],
    );

    return Response.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}