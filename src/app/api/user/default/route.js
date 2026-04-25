import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
    const userId = formData.get("userId");

    const imageUrl = file;

    await pool.query("UPDATE users SET profile_image = $1 WHERE id = $2", [
      imageUrl,
      userId,
    ]);

    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
