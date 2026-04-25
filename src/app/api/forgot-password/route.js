import { NextResponse } from "next/server";
import crypto from "crypto";
import pool from "../../../lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // check user
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "Email not associated with any account" },
        { status: 404 },
      );
    }

    // generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

    // store token
    console.log(token, expiry);

    await pool.query(
      `UPDATE users 
       SET reset_token = $1, reset_token_expiry = $2
       WHERE email = $3`,
      [token, expiry, email],
    );
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset/${token}`;

    await resend.emails.send({
      from: "Support <onboarding@resend.dev>",
      to: email,
      subject: "Reset your password",
      html: `
        <div>
          <h2>Password Reset Request</h2>
          <p>This link expires in 15 minutes.</p>
          <a href="${resetLink}" style="padding:10px 15px;background:#0000FF;color:#fff;border-radius:5px;text-decoration:none;">
            Reset Password
          </a>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Reset email sent",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
