import pool from "../../../../lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `SELECT id, is_verified, verification_expires
       FROM users
       WHERE verification_token = $1`,
      [token],
    );

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "Verification link is invalid or has expired" },
        { status: 400 },
      );
    }

    // ✅ If already verified, redirect immediately
    if (user.email_verified) {
      console.log("yo");
      return NextResponse.json({
        success: true,
        redirect: `/login?verified=true&msg=${encodeURIComponent(
          "Email has been verified. You can login now.",
        )}`,
      });
    }

    // Check if token expired
    if (new Date() > new Date(user.verification_expires)) {
      return NextResponse.json(
        { error: "Verification link expired" },
        { status: 400 },
      );
    }

    // Update user to verified
    await pool.query(
      `UPDATE users
       SET email_verified = true
       WHERE id = $1`,
      [user.id],
    );
    console.log("verified");
    return NextResponse.json({
      success: true,
      redirect: `/login?verified=true&msg=${encodeURIComponent(
        "Email has been verified. You can login now.",
      )}`,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
