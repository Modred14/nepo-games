import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

export async function POST(req) {
  try {
    const { userId, first_name, surname } = await req.json();

    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);

    const user = result.rows;

    if (!first_name) {
      return NextResponse.json(
        { error: "First name is required" },
        { status: 400 },
      );
    }
    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await pool.query(
      "UPDATE users SET first_name = $1, surname = $2 WHERE id = $3",
      [first_name, surname, userId],
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
