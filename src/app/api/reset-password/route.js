import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import pool from "../../../../lib/db";

export async function POST(req) {
  try {
    const { token, newPassword } = await req.json();
 console.log(token, newPassword)
    // 1. basic validation
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Missing token or password" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password too weak" },
        { status: 400 }
      );
    }

    // 2. find user with valid token + not expired
    const result = await pool.query(
      `SELECT * FROM users 
       WHERE reset_token = $1 
       AND reset_token_expiry > NOW()`,
      [token]
    );

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    // 3. hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. update password + clear reset token (CRITICAL)
    await pool.query(
      `UPDATE users 
       SET password_hash = $1,
           reset_token = NULL,
           reset_token_expiry = NULL
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    return NextResponse.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("Reset password error:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}