import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import crypto from "crypto";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import pool from "../../../../lib/db";
import { resend } from "../../../../lib/resend";

const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

const normalizeImage = (img) => {
  if (typeof img === "string" && img.trim() !== "") return img;
  return defaultAvatar;
};

export const authOptions = {
  providers: [
    // ✅ GOOGLE LOGIN
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // ✅ EMAIL/PASSWORD LOGIN
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        try {
          const { email, password } = credentials;

          if (!email || !password) return null;

          const result = await pool.query(
            `SELECT * FROM users WHERE email = $1`,
            [email],
          );

          if (result.rows.length === 0) {
            throw new Error("INVALID_CREDENTIALS");
          }

          const user = result.rows[0];

          const isValid = await bcrypt.compare(password, user.password_hash);

          if (!isValid) {
            throw new Error("INVALID_CREDENTIALS");
          }

          if (!user.email_verified) {
            let token = user.verification_token;
            let expires = user.verification_expires;
            const now = new Date();
            const expiryTime = expires ? new Date(expires).getTime() : null;
            const isExpired = !expiryTime || expiryTime < now;

            if (!token || isExpired) {
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
              from: "Nepogames <nepo-games@resend.dev>",
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
            throw new Error("EMAIL_NOT_VERIFIED");
          }

          return {
            id: user.id,
            email: user.email,
          };
        } catch (err) {
          console.error("Credentials Auth Error:", err);
          throw err;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },

  callbacks: {
    // 🔥 HANDLE GOOGLE SIGN-IN + DB SYNC
    async signIn({ user, account }) {
      if (account.provider !== "google") return true;

      try {
        const { name, email, image } = user;

        if (!email) return false;

        const first_name = name?.split(" ")[0] || "Nepo User";
        const surname = name?.split(" ")[1] || "";

        const existing = await pool.query(
          `SELECT * FROM users WHERE email = $1`,
          [email],
        );

        let dbUser;

        if (existing.rows.length === 0) {
          // 🟢 CREATE USER ONLY IF NOT EXISTING
          const inserted = await pool.query(
            `INSERT INTO users (
          first_name,
          surname,
          username,
          email,
          password_hash,
          profile_image,
          provider,
          email_verified,
          phone_verified
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *`,
            [
              first_name,
              surname,
              email.split("@")[0],
              email,
              null,
              normalizeImage(image),
              "google",
              true,
              false,
            ],
          );

          dbUser = inserted.rows[0];
        } else {
          dbUser = existing.rows[0];

          // ❌ block mismatch login
          if (dbUser.provider === "credentials") {
            return "/login?msg=Email already registered. Please login with email/password.&oauthError=true";
          }
        }

        // attach user id for JWT
        user.id = dbUser.id;
        user.email = dbUser.email;

        return true;
      } catch (err) {
        console.error("Google Auth Error:", err);
        return false;
      }
    },

    // 🔥 ATTACH USER TO TOKEN
    async jwt({ token, user }) {
      // On login
      if (user) {
        token.user = user;
      }
      return token;
    },

    // 🔥 EXPOSE USER TO FRONTEND + APIs
    async session({ session, token }) {
      session.user = token.user;
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
