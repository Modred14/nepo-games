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

async function fetchFullUserProfile(email) {
  const result = await pool.query(
    `SELECT 
      id,
      email,
      first_name,
      surname,
      username,password_hash,
      profile_image,
      phone_verified,
      plan,
      subscription_status,
      subscription_start,
      subscription_end,
      payment_provider,
      pin_set,
      provider,
      role,
      email_verified,       
      verification_token,    
      verification_expires
     FROM users
     WHERE email = $1`,
    [email],
  );
  return result.rows[0] || null;
}

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

          const user = await fetchFullUserProfile(email);

          if (!user) {
            throw new Error("INVALID_CREDENTIALS");
          }

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
            throw new Error("EMAIL_NOT_VERIFIED");
          }

          return {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            surname: user.surname,
            username: user.username,
            profile_image: normalizeImage(user.profile_image),
            phone_verified: user.phone_verified,
            plan: user.plan,
            subscription_status: user.subscription_status,
            subscription_start: user.subscription_start,
            subscription_end: user.subscription_end,
            payment_provider: user.payment_provider,
            pin_set: user.pin_set,
            role: user.role,
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

        user.id = dbUser.id;
        user.email = dbUser.email;
        user.first_name = dbUser.first_name;
        user.surname = dbUser.surname;
        user.username = dbUser.username;
        user.profile_image = normalizeImage(dbUser.profile_image);
        user.phone_verified = dbUser.phone_verified;
        user.plan = dbUser.plan;
        user.subscription_status = dbUser.subscription_status;
        user.subscription_start = dbUser.subscription_start;
        user.subscription_end = dbUser.subscription_end;
        user.payment_provider = dbUser.payment_provider;
        user.pin_set = dbUser.pin_set;
        user.role = dbUser.role;

        return true;
      } catch (err) {
        console.error("Google Auth Error:", err);
        return false;
      }
    },

    // 🔥 ATTACH USER TO TOKEN
    async jwt({ token, user, trigger, session }) {
      // On login
      if (user) {
        token.user = {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          surname: user.surname,
          username: user.username,
          profile_image: user.profile_image,
          phone_verified: user.phone_verified,
          plan: user.plan,
          subscription_status: user.subscription_status,
          subscription_start: user.subscription_start,
          subscription_end: user.subscription_end,
          payment_provider: user.payment_provider,
          pin_set: user.pin_set,
          role: user.role,
        };
      }
      if (trigger === "update" && session?.user) {
        token.user = { ...token.user, ...session.user };
      }

      return token;
    },

    // 🔥 EXPOSE USER TO FRONTEND + APIs
    async session({ session, token }) {
      if (token.user) {
        session.user = {
          ...token.user,
          is_verified:
            (token.user.subscription_status || "").toLowerCase() === "active" &&
            token.user.subscription_end &&
            new Date(token.user.subscription_end).getTime() > Date.now(),
        };
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
