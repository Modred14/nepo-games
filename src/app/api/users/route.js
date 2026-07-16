// src/app/api/users/route.js
import pool from "../../../lib/db";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { resend } from "../../../lib/resend";

export async function POST(req) {
  try {
    const token = crypto.randomBytes(32).toString("hex");
    const defaultAvatar =
      "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    const { first_name, surname, username, email, password } = await req.json();

    // FIX: signup previously accepted any password at all (even 1 character)
    // while reset-password enforced a 6-char minimum — inconsistent, and a
    // weak-password hole on the most important entry point. Mirror the same
    // rule here.
    if (!first_name || !surname || !username || !email || !password) {
      return Response.json(
        { error: "All fields are required." },
        { status: 400 },
      );
    }

    if (typeof password !== "string" || password.length < 6) {
      return Response.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 },
      );
    }

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
  (first_name, surname, username, email, password_hash, profile_image, verification_token, verification_expires, phone_number, phone_verified, phone_verification_code, reset_token, reset_token_expiry, provider)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
  RETURNING id, first_name, surname, username, email, profile_image, phone_verified`,
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
        "credentials",
      ],
    );
    const verifyLink = `${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${token}`;

    await resend.emails.send({
      from: "Nepogames <no-reply@support.nepogames.com>",
      to: email,
      subject: "Verify your email address",
      html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Verify your email</title>
    </head>
    <body style="margin:0;padding:0;background:#F5F5F4;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
        <tr>
          <td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E7E5E4;">

              <!-- Header -->
          

              <!-- Banner -->
              <tr>
                <td>
                  <img src="https://res.cloudinary.com/dagot597u/image/upload/v1776988411/welcome_mfzptd.png"
                       alt="Welcome to Nepogames" width="520"
                       style="display:block;border:none;width:100%;max-height:200px;object-fit:cover;" />
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">

                  <!-- Icon -->
                  <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                    <tr>
                      <td style="width:52px;height:52px;background:#DBEAFE;border-radius:12px;text-align:center;vertical-align:middle;">
                        <img src="https://img.icons8.com/ios/50/1D4ED8/secured-letter.png" width="26" height="26" alt="" />
                      </td>
                    </tr>
                  </table>

                  <h1 style="margin:0 0 8px;font-size:24px;font-weight:500;color:#0A0A0A;font-family:Georgia,serif;">
                    Verify your email address
                  </h1>
                  <p style="margin:0 0 28px;font-size:15px;color:#57534E;line-height:1.6;">
                    Welcome to <strong>Nepogames</strong>! You're one step away from buying and selling games securely.
                    Click the button below to confirm your email address.
                  </p>

                  <!-- CTA -->
                  <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
                    <tr>
                      <td align="center">
                        <a href="${verifyLink}"
                           style="display:inline-block;background:#1D4ED8;color:#ffffff;font-size:15px;font-weight:500;
                                  text-decoration:none;padding:13px 32px;border-radius:8px;">
                          Verify email address
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Divider -->
                  <hr style="border:none;border-top:1px solid #E7E5E4;margin:0 0 28px;" />

                  <!-- Fallback URL -->
                  <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#78716C;">
                    Or copy this link
                  </p>
                  <p style="margin:0 0 24px;font-size:12px;color:#1D4ED8;word-break:break-all;
                            background:#FAFAF9;padding:10px 12px;border-radius:6px;border:1px solid #E7E5E4;
                            font-family:monospace;">
                    ${verifyLink}
                  </p>

                  <!-- Expiry notice -->
                  <table cellpadding="0" cellspacing="0" style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;width:100%;">
                    <tr>
                      <td style="padding:12px 14px;font-size:13px;color:#9A3412;line-height:1.5;">
                        ⏱ This link expires in <strong>1 hour</strong>. If you didn't create an account,
                        you can safely ignore this email.
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#FAFAF9;border-top:1px solid #E7E5E4;padding:20px 40px;">
                  <p style="margin:0 0 4px;font-size:12px;color:#78716C;line-height:1.6;">
                    This email was sent to <strong>${email}</strong>.
                    Questions? Contact <a href="mailto:support@nepogames.com" style="color:#78716C;">support@nepogames.com</a>.
                  </p>
                  <p style="margin:8px 0 0;font-size:12px;color:#A8A29E;">
                    © ${new Date().getFullYear()} Nepogames. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
      text: `Welcome to Nepogames!

Verify your email by visiting the link below (expires in 1 hour):
${verifyLink}

If you didn't create an account, ignore this email.`,
    });

    return Response.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error(err);

    // FIX: the SELECT-then-INSERT duplicate check above isn't atomic — two
    // signups for the same email/username submitted at the same instant can
    // both pass the SELECT before either INSERT commits. This requires a
    // UNIQUE constraint on users.email and users.username at the DB level
    // to actually be caught here (Postgres error code 23505); add that
    // constraint via migration if it doesn't already exist. This catch turns
    // that race into a clean, friendly error instead of a generic 500.
    if (err.code === "23505") {
      return Response.json(
        {
          error:
            "That email or username was just taken by someone else. Please try again.",
        },
        { status: 409 },
      );
    }

    return Response.json(
      { error: "Something went wrong while creating the account." },
      { status: 500 },
    );
  }
}