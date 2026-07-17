// src/app/api/send-otp/route.js
import crypto from "crypto";
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

// FIX (critical): this file previously used `export default function
// handler(req, res)` with `req.body` / `res.status()` — the Pages Router
// API style. This file lives under the App Router (`src/app/api/...`),
// which only recognizes named exports like `export async function POST`.
// Next.js was never routing requests to this handler at all; phone OTP
// sending was completely non-functional. Rewritten below as a proper App
// Router POST handler, and switched the in-memory otpStore (which doesn't
// survive across Fly.io machine restarts/auto-stop, see fly.toml) for
// DB-backed storage on the users row itself, matching the pattern already
// used by send-email-otp/route.js.
//
// NOTE: nothing in the frontend currently calls this endpoint — phone
// verification isn't wired into any page yet. This fix makes the endpoint
// itself work correctly; you'll still need to build the UI that calls it
// when you're ready to turn phone verification on.
export async function POST(req) {
  try {
    const user = await requireUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone } = await req.json();

    if (!phone) {
      return Response.json({ error: "Phone is required" }, { status: 400 });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE phone_number = $1 AND id != $2 LIMIT 1",
      [phone, user.id],
    );

    if (existingUser.rows.length > 0) {
      return Response.json(
        { error: "Phone number already in use" },
        { status: 400 },
      );
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // FIX: the phone number itself is packed alongside the OTP (as
    // "<otp>:<phone>") in the existing phone_verification_code column,
    // rather than requiring a new DB column that isn't confirmed to exist.
    // verify-otp splits this back apart and checks BOTH the code and the
    // phone number match what was actually texted — otherwise a user could
    // request an OTP for one phone number and use the resulting code to
    // verify a completely different one.
    await pool.query(
      `UPDATE users
       SET phone_verification_code = $1, verification_expires = $2
       WHERE id = $3`,
      [`${otp}:${phone}`, expires, user.id],
    );

    const smsRes = await fetch("https://api.termii.com/api/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        from: "Modred",
        sms: `Your verification code is ${otp}. It expires in 5 minutes.`,
        type: "plain",
        channel: "generic",
        api_key: process.env.TERMII_API_KEY,
      }),
    });

    if (!smsRes.ok) {
      console.error("Termii SMS send failed:", smsRes.status, await smsRes.text());
      return Response.json({ error: "Failed to send OTP" }, { status: 502 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    return Response.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}