import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import pool from "../../../../../lib/db";

export async function POST(req) {
  try {
    const { userId, currentPassword, newPassword } = await req.json();

    const [user] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);

    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user[0].password);

    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      hashed,
      userId,
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}