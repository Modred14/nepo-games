import { NextResponse } from "next/server";
import { uploadImage } from "../../../../lib/uploadImage";
import pool from "../../../../lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req) {
  try {
      const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const userId = user.id
    const formData = await req.formData();
    const file = formData.get("file");


    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 🔥 Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be less than 2MB" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const imageUrl = await uploadImage(buffer);

    // Save to DB
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
