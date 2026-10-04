// ROUTE: src/app/api/reset-password/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import crypto from "crypto";
import pool from "../../../lib/db";
import { checkRateLimit, getClientIp, tooManyRequests } from "../../../lib/rateLimit";

export async function POST(req) {
  try {
    const rl = await checkRateLimit(`reset-ip:${getClientIp(req)}`, {
      limit: 10,
      windowSeconds: 900,
      failClosed: true,
    });
    if (!rl.allowed) return tooManyRequests();

    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Missing token or password" }, { status: 400 });
    }
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }
    if (newPassword.length < 8 || newPassword.length > 72) {
      return NextResponse.json(
        { error: "Password must be between 8 and 72 characters long." },
        { status: 400 },
      );
    }

    // Tokens are stored hashed (see forgot-password). Tokens issued before
    // this change were stored in plaintext, so both forms are accepted until
    // those 15-minute tokens have expired.
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Single atomic statement: the token is consumed in the same UPDATE that
    // sets the password, so one token can never be used twice (even by two
    // simultaneous requests).
    const result = await pool.query(
      `UPDATE users
          SET password_hash = $1,
              reset_token = NULL,
              reset_token_expiry = NULL
        WHERE (reset_token = $2 OR reset_token = $3)
          AND reset_token_expiry > NOW()
        RETURNING id`,
      [hashedPassword, tokenHash, token],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
