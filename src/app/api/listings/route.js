// ROUTE: src/app/api/listings/route.js
// src/app/api/listings/route.js
import pool from "../../../lib/db";
import { uploadImage } from "../../../lib/uploadImage";
import crypto from "crypto";
import { requireUser } from "@/lib/auth";
import sharp from "sharp";
import { getSetting } from "@/lib/settings";
import { checkRateLimit, tooManyRequests } from "@/lib/rateLimit";

// Allowlists (mirror the options offered by /sell-game).
const ALLOWED_PLATFORMS = ["mobile", "pc", "xbox", "playstation"];
const ALLOWED_COVERS = [
  "bloodstrike-ac.png", "call-of-duty.png", "delta.png", "dls.png",
  "fifa.png", "efootball.png", "freefire-ac.png", "pubg.png",
];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

// Tune these to taste
const MAX_WIDTH = 1600;   // resize down if larger
const JPEG_QUALITY = 80;  // 75-85 is the sweet spot: small file, no visible loss

async function compressImage(buffer) {
  // limitInputPixels guards against decompression bombs. sharp decodes the
  // real bytes, so a file that is not genuinely an image is rejected here
  // regardless of its claimed MIME type / extension.
  return sharp(buffer, { limitInputPixels: 40_000_000 })
    .rotate() // auto-orient based on EXIF, then strips EXIF
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
}

export async function POST(req) {
  try {
    // Auth BEFORE parsing the (large) multipart body.
    const user = await requireUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Server-side enforcement of the seller-verification gate that the UI
    // only enforced with a redirect.
    if (!user.phone_verified) {
      return Response.json(
        { error: "Verify your account before creating listings." },
        { status: 403 },
      );
    }

    const rl = await checkRateLimit(`create-listing:${user.id}`, { limit: 10, windowSeconds: 3600 });
    if (!rl.allowed) return tooManyRequests("You're creating listings too quickly. Try again later.");

    const formData = await req.formData();

    const [maintenanceMode, newListingsEnabled] = await Promise.all([
      getSetting("maintenance_mode"),
      getSetting("new_listings_enabled"),
    ]);

    if (maintenanceMode) {
      return Response.json(
        { error: "New listings are temporarily unavailable — the marketplace is under maintenance." },
        { status: 503 },
      );
    }
    if (!newListingsEnabled) {
      return Response.json(
        { error: "New listings are temporarily disabled. Please check back later." },
        { status: 503 },
      );
    }

    const user_id = user.id;
    const str = (v) => (typeof v === "string" ? v.trim() : "");
    const title = str(formData.get("title"));
    const description = str(formData.get("description"));
    const price = formData.get("price");
    const platform = str(formData.get("platform")).toLowerCase();
    const cover_image = str(formData.get("cover_image"));
    const files = formData.getAll("images");

    if (!title || !description || !price || !platform) {
      return Response.json({ error: "Missing fields", step: "validation" }, { status: 400 });
    }
    if (title.length < 3 || title.length > 100) {
      return Response.json({ error: "Title must be 3-100 characters", step: "validation" }, { status: 400 });
    }
    if (description.length < 10 || description.length > 3000) {
      return Response.json({ error: "Description must be 10-3000 characters", step: "validation" }, { status: 400 });
    }
    if (!ALLOWED_PLATFORMS.includes(platform)) {
      return Response.json({ error: "Invalid platform", step: "validation" }, { status: 400 });
    }
    if (cover_image && !ALLOWED_COVERS.includes(cover_image)) {
      return Response.json({ error: "Invalid cover image", step: "validation" }, { status: 400 });
    }

    const numericPrice = Math.round(Number(price) * 100) / 100;
    const [minListingPrice, maxListingPrice] = await Promise.all([
      getSetting("min_listing_price"),
      getSetting("max_listing_price"),
    ]);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return Response.json(
        { error: "Price must be a positive number", step: "validation" },
        { status: 400 },
      );
    }

    if (numericPrice < Number(minListingPrice)) {
      return Response.json(
        {
          error: `Price must be at least ₦${Number(minListingPrice).toLocaleString()}`,
          step: "validation",
        },
        { status: 400 },
      );
    }

    if (numericPrice > Number(maxListingPrice)) {
      return Response.json(
        {
          error: `Price cannot exceed ₦${Number(maxListingPrice).toLocaleString()}`,
          step: "validation",
        },
        { status: 400 },
      );
    }

    if (!files || files.length !== 5) {
      return Response.json(
        {
          error: "Upload exactly 5 images",
          step: "image-validation",
          received: files?.length || 0,
        },
        { status: 400 },
      );
    }

    // Validate every file BEFORE uploading any of them.
    for (const file of files) {
      if (typeof file === "string" || typeof file?.arrayBuffer !== "function") {
        return Response.json({ error: "Invalid image upload", step: "image-validation" }, { status: 400 });
      }
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return Response.json({ error: "Images must be JPEG, PNG or WebP", step: "image-validation" }, { status: 400 });
      }
      if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
        return Response.json({ error: "Each image must be under 8MB", step: "image-validation" }, { status: 400 });
      }
    }

    const imageUrls = await Promise.all(
      files.map(async (file, index) => {
        try {

          const rawBuffer = Buffer.from(await file.arrayBuffer());

          if (!rawBuffer || rawBuffer.length === 0) {
            throw new Error("Empty buffer");
          }

          // Re-encoding through sharp strips EXIF/metadata and any
          // non-image payload hidden in the file.
          const compressedBuffer = await compressImage(rawBuffer);

          const url = await uploadImage(compressedBuffer);

          if (!url) {
            throw new Error("Upload returned empty URL");
          }
          return url;
        } catch (err) {
          throw new Error(`Image ${index + 1} upload failed`);
        }
      }),
    );

    const slugBase = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const safeSlugBase = slugBase || "listing";
    let result;

    for (let i = 0; i < 3; i++) {
      try {
        const slug = `${safeSlugBase}-${crypto.randomUUID().slice(0, 6)}`;

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
            cover_image || null,
            imageUrls,
          ],
        );
        break;
      } catch (err) {

        if (err.code === "23505") {
          continue;
        }

        throw err;
      }
    }

    if (!result) {
      return Response.json(
        { error: "Failed to create listing after retries" },
        { status: 500 },
      );
    }

    return Response.json(
      {
        message: "Listing created successfully",
        listing: result.rows[0],
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Create listing error:", err.message);
    // Image failures are the user's to retry; never echo internals.
    const imageFailure = /^Image \d+ upload failed$/.test(err.message);
    return Response.json(
      { error: imageFailure ? err.message : "Server error" },
      { status: imageFailure ? 400 : 500 },
    );
  }
}