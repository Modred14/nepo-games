import bcrypt from "bcrypt";
import { requireUser } from "@/lib/auth";
import pool from "@/lib/db";

export async function POST(req) {
  try {
    const { currentPin, newPin } = await req.json();
    const user = await requireUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

   
    if (!/^\d{4}$/.test(newPin)) {
      return Response.json(
        { error: "New PIN must be exactly 4 digits" },
        { status: 400 },
      );
    }
    if (currentPin === newPin) {
      return Response.json(
        { error: "New PIN cannot be the same as current PIN" },
        { status: 400 },
      );
    }

    // 🔥 get current user pin from DB
    const result = await pool.query(
      `SELECT pin_hash, pin_set FROM users WHERE id = $1`,
      [user.id],
    );

    const dbUser = result.rows[0];

    if (!dbUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    const isMatch = await bcrypt.compare(currentPin, dbUser.pin_hash);

    if (
      dbUser.pin_locked_until &&
      new Date(dbUser.pin_locked_until) > new Date()
    ) {
      return Response.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 },
      );
    }
    if (!isMatch) {
      const attempts = (dbUser.pin_attempts || 0) + 1;

      // lock after 5 tries
      if (attempts >= 5) {
        await pool.query(
          `
      UPDATE users
      SET pin_attempts = $1,
          pin_locked_until = NOW() + INTERVAL '15 minutes'
      WHERE id = $2
      `,
          [attempts, user.id],
        );

        return Response.json(
          { error: "Too many failed attempts. Locked for 15 minutes." },
          { status: 429 },
        );
      }

      await pool.query(
        `
    UPDATE users
    SET pin_attempts = $1
    WHERE id = $2
    `,
        [attempts, user.id],
      );

      return Response.json({ error: "Incorrect PIN" }, { status: 400 });
    }
    // ===============================
    // CASE 1: PIN already exists
    // ===============================
    await pool.query(
      `
  UPDATE users
  SET pin_attempts = 0,
      pin_locked_until = NULL
  WHERE id = $1
  `,
      [user.id],
    );
    if (dbUser.pin_set) {
      if (!currentPin) {
        return Response.json(
          { error: "Current PIN is required" },
          { status: 400 },
        );
      }

      const isMatch = await bcrypt.compare(currentPin, dbUser.pin_hash);

      if (!isMatch) {
        return Response.json(
          { error: "Incorrect current PIN" },
          { status: 400 },
        );
      }
    }

    const hash = await bcrypt.hash(newPin, 10);

    await pool.query(
      `
      UPDATE users
      SET pin_hash = $1,
          pin_set = true
      WHERE id = $2
      `,
      [hash, user.id],
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
