// src/app/api/listings/route.js
import pool from "../../../lib/db";
import { uploadImage } from "../../../lib/uploadImage";
import crypto from "crypto";
import { requireUser } from "@/lib/auth";
import sharp from "sharp";

// Tune these to taste
const MAX_WIDTH = 1600;   // resize down if larger
const JPEG_QUALITY = 80;  // 75-85 is the sweet spot: small file, no visible loss

async function compressImage(buffer) {
  return sharp(buffer)
    .rotate() // auto-orient based on EXIF, then strips EXIF
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
}

export async function POST(req) {
  try {
    console.log("[STEP 1] Request received");

    const formData = await req.formData();
    console.log("[STEP 2] FormData parsed");

    const user = await requireUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const user_id = user.id;
    const title = formData.get("title");
    const description = formData.get("description");
    const price = formData.get("price");
    const platform = formData.get("platform");
    const cover_image = formData.get("cover_image");
    const files = formData.getAll("images");

    console.log("[STEP 3] Fields extracted", {
      user_id,
      title,
      price,
      platform,
      filesCount: files?.length,
    });

    if (!user_id || !title || !description || !price || !platform) {
      console.error("[ERROR] Missing required fields");
      return Response.json(
        { error: "Missing fields", step: "validation" },
        { status: 400 },
      );
    }

    // FIX: price came straight from formData (a string) with no numeric
    // validation at all — a garbage, zero, or negative price could reach
    // the DB. Validate it here, before the costly image upload work below,
    // and cap it at a sane upper bound to guard against typos/overflow.
    const numericPrice = Number(price);
    const MAX_LISTING_PRICE = 50_000_000; // ₦10,000,000 sanity cap

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      console.error("[ERROR] Invalid price", { price });
      return Response.json(
        { error: "Price must be a positive number", step: "validation" },
        { status: 400 },
      );
    }

    if (numericPrice > MAX_LISTING_PRICE) {
      console.error("[ERROR] Price exceeds sane maximum", { price });
      return Response.json(
        {
          error: `Price cannot exceed ₦${MAX_LISTING_PRICE.toLocaleString()}`,
          step: "validation",
        },
        { status: 400 },
      );
    }

    if (!files || files.length !== 5) {
      console.error("[ERROR] Invalid image count", {
        received: files?.length,
      });
      return Response.json(
        {
          error: "Upload exactly 5 images",
          step: "image-validation",
          received: files?.length || 0,
        },
        { status: 400 },
      );
    }

    console.log("[STEP 4] Starting image uploads");

    const imageUrls = await Promise.all(
      files.map(async (file, index) => {
        try {
          console.log(`[UPLOAD] Processing image ${index + 1}`);

          const rawBuffer = Buffer.from(await file.arrayBuffer());

          if (!rawBuffer || rawBuffer.length === 0) {
            console.error(`[UPLOAD ERROR] Empty buffer at image ${index + 1}`);
            throw new Error("Empty buffer");
          }

          const beforeSize = rawBuffer.length;
          const compressedBuffer = await compressImage(rawBuffer);
          const afterSize = compressedBuffer.length;

          console.log(
            `[COMPRESS] Image ${index + 1}: ${(beforeSize / 1024).toFixed(0)}KB -> ${(afterSize / 1024).toFixed(0)}KB`
          );

          const url = await uploadImage(compressedBuffer);

          if (!url) {
            console.error(
              `[UPLOAD ERROR] No URL returned for image ${index + 1}`,
            );
            throw new Error("Upload returned empty URL");
          }

          console.log(`[UPLOAD SUCCESS] Image ${index + 1}`);
          return url;
        } catch (err) {
          console.error(`[UPLOAD FAILED] Image ${index + 1}`, err);
          throw new Error(`Image ${index + 1} upload failed`);
        }
      }),
    );

    console.log("[STEP 5] All images uploaded", imageUrls);

    const slugBase = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    console.log("[STEP 6] Slug base created:", slugBase);

    let result;

    for (let i = 0; i < 3; i++) {
      try {
        const slug = `${slugBase}-${crypto.randomUUID().slice(0, 6)}`;

        console.log(`[DB] Attempt ${i + 1} inserting slug:`, slug);

        result = await pool.query(
          `
          INSERT INTO listings (
            user_id, title, slug, description, price,
            currency, platform, cover_image, proof_image_url
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          RETURNING *
          `,
          [
            user_id,
            title,
            slug,
            description,
            numericPrice,
            "NGN",
            platform,
            cover_image,
            imageUrls,
          ],
        );

        console.log("[DB SUCCESS] Listing created");
        break;
      } catch (err) {
        console.error(`[DB ERROR] Attempt ${i + 1}`, {
          code: err.code,
          message: err.message,
        });

        if (err.code === "23505") {
          console.warn("[DB RETRY] Duplicate slug detected");
          continue;
        }

        throw new Error(`DB insert failed: ${err.message}`);
      }
    }

    if (!result) {
      console.error("[FATAL] All DB insert attempts failed");
      return Response.json(
        { error: "Failed to create listing after retries" },
        { status: 500 },
      );
    }

    console.log("[SUCCESS] Listing fully created");

    return Response.json(
      {
        message: "Listing created successfully",
        listing: result.rows[0],
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[SERVER CRASH]", {
      message: err.message,
      stack: err.stack,
    });

    return Response.json(
      {
        error: "Server error",
        details: err.message,
      },
      { status: 500 },
    );
  }
}