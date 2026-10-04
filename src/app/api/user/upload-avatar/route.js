// ROUTE: src/app/api/user/upload-avatar/route.js
import { NextResponse } from "next/server";
import sharp from "sharp";
import { uploadImage } from "../../../../lib/uploadImage";
import pool from "../../../../lib/db";
import { requireUser } from "@/lib/auth";
import { checkRateLimit, tooManyRequests } from "@/lib/rateLimit";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = await checkRateLimit(`avatar:${user.id}`, { limit: 10, windowSeconds: 3600 });
    if (!rl.allowed) return tooManyRequests();

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Image must be JPEG, PNG or WebP" }, { status: 400 });
    }
    if (file.size <= 0 || file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be less than 2MB" }, { status: 400 });
    }

    // Decode + re-encode: rejects non-images, strips metadata, caps size.
    let buffer;
    try {
      buffer = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 25_000_000 })
        .rotate()
        .resize({ width: 512, height: 512, fit: "cover" })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch {
      return NextResponse.json({ error: "That file is not a valid image" }, { status: 400 });
    }

    const imageUrl = await uploadImage(buffer);
    await pool.query("UPDATE users SET profile_image = $1 WHERE id = $2", [imageUrl, user.id]);

    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("Avatar upload error:", err.message);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
