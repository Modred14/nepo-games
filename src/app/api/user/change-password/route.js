import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import pool from "../../../../lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req) {
  try {
    const { userId, currentPassword, newPassword } = await req.json();


 const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      user.id,
    ]);  
      const dbUser = result.rows[0];
    if (!dbUser?.password_hash) {
      return NextResponse.json(
        { error: "User record doesn't contain password" },
        { status: 404 },
      );
    }

    if (!currentPassword) {
      return NextResponse.json(
        { error: "Current password missing" },
        { status: 400 },
      );
    }

    const valid = await bcrypt.compare(currentPassword, dbUser.password_hash);

    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      hashed,
      user.id,
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
