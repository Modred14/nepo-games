import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import pool from "../../../../../lib/db";

const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
const normalizeImage = (img) => {
  if (typeof img === "string" && img.trim() !== "") return img;
  return defaultAvatar;
};
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ user }) {
      try {
        const { name, email, image } = user;

        if (!email) return false;

        // Split name safely
        const first_name = name?.split(" ")[0] || "User";
        const surname = name?.split(" ")[1] || "";

        const existing = await pool.query(
          "SELECT id, email, provider, first_name, surname, username, profile_image FROM users WHERE email = $1",
          [email],
        );

        // 🔥 CASE 1: USER EXISTS
        if (existing.rows.length > 0) {
          const dbUser = existing.rows[0];

          // ❌ If registered manually → block Google signup
          if (dbUser.provider === "credentials") {
            return "/login?msg=Email already registered. Please login with email/password.&oauthError=true";
          }

          // ✅ If Google user → allow login
          user.dbUser = dbUser;
          return true;
        }

        // 3. Create new Google user
        const result = await pool.query(
          `INSERT INTO users (
        first_name,
        surname,
        username,
        email,
        password_hash,
        profile_image,
        verification_token,
        verification_expires,
        phone_number,
        phone_verified,
        phone_verification_code,
        reset_token,
        reset_token_expiry,
        provider, 
        email_verified
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING      email,
     first_name,
     id,
     profile_image,
     surname,
     username, phone_verified`,
          [
            first_name,
            surname,
            email.split("@")[0], // simple username
            email,
            null, // no password for Google users
            normalizeImage(image),
            null,
            null,
            null,
            false,
            null,
            null,
            null,
            "google",
            true,
          ],
        );
        user.dbUser = result.rows[0];
        return true;
      } catch (err) {
        console.error("Google Auth Error:", err);
        return false;
      }
    },

    async jwt({ token, user }) {
      // First login
      if (user?.email) {
        const result = await pool.query(
          `SELECT id, email, phone_verified, first_name, surname, username, profile_image
           FROM users
           WHERE email = $1`,
          [user.email],
        );

        if (result.rows.length > 0) {
          const dbUser = result.rows[0];

          token.user = {
            ...dbUser,
            profile_image: normalizeImage(dbUser.profile_image),
          };
        }

        return token;
      }
      if (token?.user?.email) {
        const result = await pool.query(
          `SELECT id, email, phone_verified, first_name, surname, username, profile_image
           FROM users
           WHERE email = $1`,
          [token.user.email],
        );

        if (result.rows.length > 0) {
          const dbUser = result.rows[0];

          token.user = {
            ...dbUser,
            profile_image: normalizeImage(dbUser.profile_image),
          };
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user = token.user || session.user;
      return session;
    },

    async redirect({ baseUrl }) {
      return `${baseUrl}/signup`;
    },
  },

  pages: {
    signIn: "/login", // your custom login page
  },
});

export { handler as GET, handler as POST };
