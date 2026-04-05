import pool from "../../../../lib/db";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { resend } from "../../../../lib/resend";

export async function POST(req) {
  try {
    const token = crypto.randomBytes(32).toString("hex");
    const defaultAvatar =
      "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    const { first_name, surname, username, email, password } = await req.json();
    const existingUsers = await pool.query(
      "SELECT email, username FROM users WHERE email = $1 OR username = $2",
      [email, username],
    );
    const phone_number = null;

    if (existingUsers.rows.length > 0) {
      const emailTaken = existingUsers.rows.some((u) => u.email === email);
      const usernameTaken = existingUsers.rows.some(
        (u) => u.username === username,
      );

      if (emailTaken) {
        return Response.json(
          { error: "Email already registered. Log in or use another email." },
          { status: 409 },
        );
      }

      if (usernameTaken) {
        return Response.json(
          {
            error: "This username is already taken. Kindly choose another one.",
          },
          { status: 409 },
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users
  (first_name, surname, username, email, password_hash, profile_image, verification_token, verification_expires, phone_number, phone_verified, phone_verification_code, reset_token, reset_token_expiry) 
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
  RETURNING id, first_name, surname, username, email, profile_image`,
      [
        first_name,
        surname,
        username,
        email,
        hashedPassword,
        defaultAvatar,
        token,
        expires,
        null,
        false,
        null,
        null,
        null,
      ],
    );
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

    return Response.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error(err);

    return Response.json(
      { error: "Something went wrong while creating the account." },
      { status: 500 },
    );
  }
}
