// src/app/api/verify-otp/route.js
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

// FIX (critical): same App Router handler-signature bug as send-otp/route.js
// — this was `export default function handler(req, res)` with `req.body`,
// which Next.js's App Router never routes to at all. On top of that, the
// UPDATE statement below used to write `phone = $1`, but the real column
// on the users table (used everywhere else in this codebase, e.g.
// market/route.js, users/route.js) is `phone_number` — so even with the
// routing bug fixed, this query would have thrown "column phone does not
// exist" on every attempt. Rewritten as a proper POST handler, using
// DB-backed OTP storage (see send-otp/route.js) instead of the in-memory
// Map in lib/otpStore.js, which doesn't survive Fly.io machine restarts.
export async function POST(req) {
  try {
    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return Response.json(
        { error: "Phone and OTP required" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `SELECT phone_verification_code, verification_expires
       FROM users WHERE id = $1`,
      [user.id],
    );

    const row = result.rows[0];

    if (!row?.phone_verification_code) {
      return Response.json({ error: "No OTP was requested." }, { status: 400 });
    }

    // Expired
    if (!row.verification_expires || new Date(row.verification_expires) < new Date()) {
      await pool.query(
        `UPDATE users
         SET phone_verification_code = NULL, verification_expires = NULL
         WHERE id = $1`,
        [user.id],
      );
      return Response.json({ error: "OTP expired" }, { status: 410 });
    }

    // FIX: the stored value is "<otp>:<phone>" (see send-otp/route.js) so
    // we can verify the submitted phone number is the SAME one the code
    // was actually sent to, not just that the code matches.
    const separatorIndex = row.phone_verification_code.indexOf(":");
    const storedOtp = row.phone_verification_code.slice(0, separatorIndex);
    const storedPhone = row.phone_verification_code.slice(separatorIndex + 1);

    if (storedOtp !== otp || storedPhone !== phone) {
      return Response.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // FIX: was `SET phone_verified = true, phone = $1` — "phone" isn't a
    // real column; this now writes to "phone_number", the actual column.
    await pool.query(
      `UPDATE users
       SET phone_verified = true,
           phone_number = $1,
           phone_verification_code = NULL,
           verification_expires = NULL
       WHERE id = $2`,
      [phone, user.id],
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}