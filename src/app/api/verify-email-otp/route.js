// ROUTE: src/app/api/verify-email-otp/route.js
import crypto from "crypto";
import pool from "../../../lib/db";
import { requireUser } from "../../../lib/auth";
import { checkRateLimit, tooManyRequests } from "../../../lib/rateLimit";

const MAX_ATTEMPTS = 5;

// SECURITY: previously unauthenticated, no attempt limit, plaintext code
// compare — a 6-digit code could be brute-forced for any email in ~1M tries.
// Now: login required, acts only on the caller's own account, max 5 wrong
// guesses per issued code, constant-time compare, code consumed on success.
export async function POST(req) {
  try {
    const sessionUser = await requireUser();
    if (!sessionUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(`email-otp-verify:${sessionUser.id}`, {
      limit: 15,
      windowSeconds: 3600,
      failClosed: true,
    });
    if (!rl.allowed) return tooManyRequests();

    const body = await req.json().catch(() => ({}));
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";
    if (!/^\d{6}$/.test(otp)) {
      return Response.json({ error: "A 6-digit code is required" }, { status: 400 });
    }

    const result = await pool.query(
      "SELECT phone_verification_code, verification_expires, COALESCE(otp_attempts, 0) AS otp_attempts FROM users WHERE id = $1",
      [sessionUser.id],
    );
    const row = result.rows[0];
    if (!row) return Response.json({ error: "User not found." }, { status: 404 });

    const stored = row.phone_verification_code;
    if (!stored || !stored.startsWith("email:")) {
      return Response.json({ error: "No OTP was requested." }, { status: 400 });
    }
    if (!row.verification_expires || new Date() > new Date(row.verification_expires)) {
      return Response.json({ error: "OTP has expired. Please request a new one." }, { status: 410 });
    }
    if (Number(row.otp_attempts) >= MAX_ATTEMPTS) {
      return Response.json({ error: "Too many incorrect attempts. Request a new code." }, { status: 429 });
    }

    const candidate = crypto.createHash("sha256").update(otp).digest("hex");
    const a = Buffer.from(stored.slice("email:".length));
    const b = Buffer.from(candidate);
    const match = a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!match) {
      await pool.query("UPDATE users SET otp_attempts = COALESCE(otp_attempts, 0) + 1 WHERE id = $1", [sessionUser.id]);
      return Response.json({ error: "Invalid OTP." }, { status: 401 });
    }

    await pool.query(
      "UPDATE users SET phone_verification_code = NULL, verification_expires = NULL, otp_attempts = 0, phone_verified = true WHERE id = $1 AND phone_verification_code = $2",
      [sessionUser.id, stored],
    );
    return Response.json({ message: "OTP verified successfully" }, { status: 200 });
  } catch (err) {
    console.error("Verify email OTP error:", err.message);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
