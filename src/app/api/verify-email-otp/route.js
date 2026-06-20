import pool from "../../../lib/db";

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return Response.json(
        { error: "Email and OTP are required" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      "SELECT phone_verification_code, verification_expires FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const { phone_verification_code, verification_expires } = result.rows[0];

    if (!phone_verification_code) {
      return Response.json({ error: "No OTP was requested." }, { status: 400 });
    }

    if (new Date() > new Date(verification_expires)) {
      return Response.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 410 },
      );
    }

    if (phone_verification_code !== otp) {
      return Response.json({ error: "Invalid OTP." }, { status: 401 });
    }

    // Clear OTP and mark as verified
    await pool.query(
      "UPDATE users SET phone_verification_code = NULL, verification_expires = NULL, phone_verified = true WHERE email = $1",
      [email],
    );
  
    return Response.json(
      { message: "OTP verified successfully" },
      { status: 200 },
    );
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
