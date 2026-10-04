// ROUTE: src/app/api/user/change-password/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import pool from "../../../../lib/db";
import { requireUser } from "@/lib/auth";
import { checkRateLimit, tooManyRequests } from "@/lib/rateLimit";

export async function POST(req) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // The current password is verified here, so cap attempts (a stolen
    // session must not be able to brute-force it).
    const rl = await checkRateLimit(`chgpw:${user.id}`, { limit: 5, windowSeconds: 900, failClosed: true });
    if (!rl.allowed) return tooManyRequests();

    const body = await req.json().catch(() => ({}));
    // A client-supplied `userId` was destructured here before and ignored;
    // the account is ALWAYS the authenticated user.
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword) {
      return NextResponse.json({ error: "Current password missing" }, { status: 400 });
    }
    if (newPassword.length < 8 || newPassword.length > 72) {
      return NextResponse.json(
        { error: "Password must be between 8 and 72 characters long." },
        { status: 400 },
      );
    }

    const result = await pool.query("SELECT password_hash FROM users WHERE id = $1", [user.id]);
    const dbUser = result.rows[0];
    if (!dbUser?.password_hash) {
      return NextResponse.json({ error: "User record doesn't contain password" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, dbUser.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hashed, user.id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Change password error:", err.message);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
