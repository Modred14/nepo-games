import pool from "../../../../lib/db";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { resend } from "../../../../lib/resend";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email and password required" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `SELECT 
  email,
  first_name,
  id,
  profile_image,
  surname,
  username,
  phone_verified,
  password_hash,
  email_verified,
  verification_token,
  verification_expires
FROM users
WHERE email = $1`,
      [email],
    );

    if (result.rows.length === 0) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // EMAIL NOT VERIFIED
    if (!user.email_verified) {
      let token = user.verification_token;
      let expires = user.verification_expires;

      const now = new Date();

      // If no token OR expired → generate new one
      if (!token || !expires || new Date(expires) < now) {
        token = crypto.randomBytes(32).toString("hex");
        expires = new Date(Date.now() + 1000 * 60 * 60);

        await pool.query(
          `UPDATE users
         SET verification_token = $1,
             verification_expires = $2
         WHERE email = $3`,
          [token, expires, email],
        );
      }
      const verifyLink = `${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${token}`;

      await resend.emails.send({
        from: "Nepo Games <nepo-games@resend.dev>",
        to: email,
        subject: "Verify your email",
        html: `
        <h2>Welcome to Nepo Games!</h2>
        <p>Click the button below to verify your email. This link expires in 1 hour.</p>
        <a href="${verifyLink}" style="display:inline-block;padding:10px 20px;background:#0070f3;color:white;text-decoration:none;border-radius:5px;">Verify Email</a>
        <p>If the button doesn't work, copy and paste this link in your browser:</p>
        <p>${verifyLink}</p>
      `,
        text: `Welcome to Nepo Games!
Verify your email by clicking the link below (expires in 1 hour):
${verifyLink}`,
      });

      return Response.json(
        {
          error: "Email not verified. A new verification email has been sent.",
        },
        { status: 403 },
      );
    }

    const {
      password_hash,
      verification_token,
      verification_expires,
      ...safeUser
    } = user;

    return Response.json(
      {
        message: "Login successful",
        user: safeUser,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error(err);

    return Response.json(
      { error: "Something went wrong logging in." },
      { status: 500 },
    );
  }
}
