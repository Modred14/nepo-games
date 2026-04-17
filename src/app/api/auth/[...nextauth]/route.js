import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import pool from "../../../../../lib/db";
import { resend } from "../../../../../lib/resend";

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

        const first_name = name?.split(" ")[0] || "User";
        const surname = name?.split(" ")[1] || "";

        const existing = await pool.query(
          `SELECT * FROM users WHERE email = $1`,
          [email],
        );

        // ✅ USER EXISTS
        if (existing.rows.length > 0) {
          const dbUser = existing.rows[0];

          // ❌ Block Google login if registered with credentials
          if (dbUser.provider === "credentials") {
            return "/login?msg=Email already registered. Please login with email/password.&oauthError=true";
          }

          return true;
        }

        // ✅ CREATE NEW GOOGLE USER
        await pool.query(
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
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
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
        token.user.id = user.id;
        return token;
      }

      // On subsequent requests → refresh from DB
      if (token?.user?.email) {
        const result = await pool.query(
          `SELECT id, email, first_name, surname, username, profile_image, phone_verified
           FROM users WHERE email = $1`,
          [token.user.email],
        );

        if (result.rows.length > 0) {
          const dbUser = result.rows[0];

          token.user = {
            ...dbUser,
            profile_image: normalizeImage(dbUser.profile_image),
            id: dbUser.id,
          };
        }
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
