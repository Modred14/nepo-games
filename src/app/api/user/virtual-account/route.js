// ORIGINAL ROUTE: src/app/api/user/virtual-account/route.js
// CHANGED: Paystack customer + dedicated_account -> Flutterwave
// POST /v3/virtual-account-numbers
//
// ⚠️ IMPORTANT PRODUCT/COMPLIANCE DECISION NEEDED, NOT JUST A CODE CHANGE:
// Flutterwave REQUIRES the user's BVN (Bank Verification Number) to create
// a permanent/static virtual account in live mode — this is a hard 400 error
// ("BVN is required for static account number") without it, not optional.
// Paystack's DVA (what this route originally created) did NOT require BVN,
// only a phone number — that's why the original code never collected one.
//
// This means your signup/profile flow needs a new field (BVN) and the
// handling that comes with it: BVN is sensitive financial PII in Nigeria,
// so you'll want to (a) confirm this is acceptable for your users before
// shipping, (b) never log or store it beyond what's needed for this one
// call, and (c) check Flutterwave's current data-handling requirements for
// BVN. This route now expects `bvn` in the POST body alongside `phone` —
// the frontend/profile UI collecting it is NOT included here since that's a
// UX decision, not a mechanical swap.
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

const FLW_BASE_URL = "https://api.flutterwave.com/v3";

// GET /api/user/virtual-account — unchanged, just reads our own DB.
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vaRes = await pool.query(
    `SELECT account_number, account_name, bank_name, currency, active
     FROM user_virtual_accounts WHERE user_id = $1`,
    [user.id],
  );

  return NextResponse.json({ virtualAccount: vaRes.rows[0] || null });
}

// POST /api/user/virtual-account
// Body (required now): { phone, bvn } if not already on file.
export async function POST(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.FLW_SECRET_KEY) {
    console.error("❌ FLW_SECRET_KEY is not configured");
    return NextResponse.json(
      { error: "Payments are not configured" },
      { status: 500 },
    );
  }

  const existing = await pool.query(
    `SELECT account_number, account_name, bank_name, currency, active
     FROM user_virtual_accounts WHERE user_id = $1`,
    [user.id],
  );
  if (existing.rows.length > 0) {
    return NextResponse.json({ virtualAccount: existing.rows[0] });
  }

  let phone = null;
  let bvn = null;
  try {
    const body = await req.json();
    phone = body?.phone || null;
    bvn = body?.bvn || null;
  } catch {
    // no body sent
  }

  const userRes = await pool.query(
    `SELECT id, first_name, surname, username, email, phone_number, bvn
     FROM users WHERE id = $1`,
    [user.id],
  );
  const dbUser = userRes.rows[0];
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!dbUser.phone_number && !phone) {
    return NextResponse.json(
      { error: "phone_required", message: "A phone number is required to set up bank transfer funding." },
      { status: 400 },
    );
  }

  // NOTE: this assumes a new `bvn` column on `users` — add it via migration
  // if it doesn't exist yet. Storing it is only necessary if you want to
  // avoid asking again; you may instead choose to never persist it and only
  // pass it through per-request, depending on your compliance posture.
  if (!dbUser.bvn && !bvn) {
    return NextResponse.json(
      {
        error: "bvn_required",
        message: "Your BVN is required to set up bank transfer funding (required by Flutterwave for permanent virtual accounts).",
      },
      { status: 400 },
    );
  }

  const phoneToUse = dbUser.phone_number || phone;
  const bvnToUse = dbUser.bvn || bvn;

  if (!dbUser.phone_number && phone) {
    const digitsOnly = String(phone).replace(/[^0-9+]/g, "");
    if (digitsOnly.length < 10 || digitsOnly.length > 14) {
      return NextResponse.json(
        { error: "Enter a valid phone number." },
        { status: 400 },
      );
    }
    await pool.query(`UPDATE users SET phone_number = $1 WHERE id = $2`, [
      digitsOnly,
      user.id,
    ]);
  }

  if (!dbUser.bvn && bvn) {
    const digitsOnly = String(bvn).replace(/[^0-9]/g, "");
    if (digitsOnly.length !== 11) {
      return NextResponse.json(
        { error: "Enter a valid 11-digit BVN." },
        { status: 400 },
      );
    }
    await pool.query(`UPDATE users SET bvn = $1 WHERE id = $2`, [
      digitsOnly,
      user.id,
    ]);
  }

  const lastName = dbUser.surname?.trim() || dbUser.username;
  const firstName = dbUser.first_name?.trim() || dbUser.username;

  try {
    const txRef = `va_${user.id}_${Date.now()}`;

    const vaRes = await fetch(`${FLW_BASE_URL}/virtual-account-numbers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: dbUser.email,
        tx_ref: txRef,
        phonenumber: phoneToUse,
        is_permanent: true,
        firstname: firstName,
        lastname: lastName,
        bvn: bvnToUse,
        narration: `${firstName} ${lastName}`,
      }),
    });
    const vaData = await vaRes.json();

    if (!vaRes.ok || vaData.status !== "success") {
      const message = vaData?.message || "";
      const notEnabled =
        /not\s*enabled|not\s*available|contact\s*support/i.test(message);

      console.error("❌ Flutterwave virtual account creation failed:", vaData);

      if (notEnabled) {
        return NextResponse.json(
          {
            error: "dva_unavailable",
            message:
              "Bank transfer funding isn't available yet. Please check back soon.",
          },
          { status: 503 },
        );
      }

      return NextResponse.json(
        { error: message || "Unable to set up bank transfer funding right now." },
        { status: 400 },
      );
    }

    const account = vaData.data;
    const bankName = account?.bank_name || "Unknown Bank";
    const accountNumber = account?.account_number;
    // Flutterwave's create response doesn't return an "account name" the
    // way Paystack's DVA did (it returns a "note"/order_ref instead) — fall
    // back to the name we sent, since that's what the bank record will show.
    const accountName = `${firstName} ${lastName}`;
    const orderRef = account?.order_ref;

    if (!accountNumber || !orderRef) {
      console.error("❌ Unexpected Flutterwave virtual account response shape:", vaData);
      return NextResponse.json(
        { error: "Unable to set up bank transfer funding right now." },
        { status: 400 },
      );
    }

    const insertRes = await pool.query(
      `INSERT INTO user_virtual_accounts
       (user_id, paystack_customer_code, paystack_customer_id, dva_id, account_number, account_name, bank_name, bank_slug, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING account_number, account_name, bank_name, currency, active`,
      [
        user.id,
        // NOTE: repurposing these Paystack-named columns to hold
        // Flutterwave's equivalents (flw_ref / order_ref) rather than
        // renaming the columns, to avoid a migration. Rename later if you'd
        // like the schema to read cleanly.
        account?.flw_ref || null,
        null,
        orderRef,
        accountNumber,
        accountName,
        bankName,
        "wema-bank",
        "NGN",
      ],
    );

    if (insertRes.rows.length > 0) {
      return NextResponse.json({ virtualAccount: insertRes.rows[0] });
    }

    const raceRes = await pool.query(
      `SELECT account_number, account_name, bank_name, currency, active
       FROM user_virtual_accounts WHERE user_id = $1`,
      [user.id],
    );
    return NextResponse.json({ virtualAccount: raceRes.rows[0] });
  } catch (err) {
    console.error("❌ Virtual account creation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
