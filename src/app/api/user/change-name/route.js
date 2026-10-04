// ROUTE: src/app/api/user/change-name/route.js
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import pool from "../../../../lib/db";

export async function POST(req) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const first_name = typeof body.first_name === "string" ? body.first_name.trim() : "";
    const surname = typeof body.surname === "string" ? body.surname.trim() : "";

    if (!first_name) {
      return NextResponse.json({ error: "First name is required" }, { status: 400 });
    }
    if (first_name.length > 50 || surname.length > 50) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }

    await pool.query("UPDATE users SET first_name = $1, surname = $2 WHERE id = $3", [
      first_name,
      surname,
      user.id,
    ]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Change name error:", err.message);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
