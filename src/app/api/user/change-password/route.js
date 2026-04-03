import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import pool from "../../../../../lib/db";

export async function POST(req) {
  try {
    const { userId, currentPassword, newPassword } = await req.json();

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);

    const user = result.rows;
    if (!user[0]?.password_hash) {
      return NextResponse.json(
        { error: "User record is invalid" },
        { status: 404 },
      );
    }

    if (!currentPassword) {
      return NextResponse.json(
        { error: "Current password missing" },
        { status: 400 },
      );
    }
    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user[0].password_hash);

    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      hashed,
      userId,
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
