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
      from: "Nepo Games <nepo-games@resend.dev>",
      to: email,
      subject: "Verify your email",
      html: `
  <div style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6f8;padding: 0 0 20px 0;">

            <!-- HERO IMAGE -->
            <tr>
              <td>
                <img src="https://res.cloudinary.com/dagot597u/image/upload/v1776988411/welcome_mfzptd.png"
                     alt="Gaming Banner"
                     width="100%"
                     style="display:block;border:none;">
              </td>
            </tr>

            <!-- CONTENT -->
            <tr>
              <td style="padding:30px;">
                <h2 style="margin-top:0;color:#111827;">Verify your email</h2>
                <p style="color:#4b5563;font-size:16px;">
                  Welcome to <strong>Nepogames</strong>! You’re one step away from buying and selling games securely.
                </p>
                <p style="color:#4b5563;font-size:16px;">
                  Click the button below to verify your email address. This link expires in <strong>1 hour</strong>.
                </p>

                <!-- BUTTON -->
                <div style="text-align:center;margin:30px 0;">
                  <a href="${verifyLink}"
                     style="background:#2563eb;color:#ffffff;box-shadow: 0 4px 12px rgba(0,0,0,0.15);padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
                     Verify Email
                  </a>
                </div>

                <!-- FALLBACK LINK -->
                <p style="color:#6b7280;font-size:14px;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="word-break:break-all;color:#2563eb;font-size:13px;">
                  ${verifyLink}
                </p>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#9ca3af;">
                <p style="margin:0;">© ${new Date().getFullYear()} Nepo Games. All rights reserved.</p>
                <p style="margin:5px 0 0;">If you didn’t create an account, you can ignore this email.</p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>
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
