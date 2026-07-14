// File: src/app/api/user/virtual-account/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

const PAYSTACK_BASE_URL = "https://api.paystack.co";
const PREFERRED_BANK = process.env.PAYSTACK_DVA_PREFERRED_BANK || "wema-bank";

// GET /api/user/virtual-account
// Returns the caller's Dedicated Virtual Account if one has already been
// created. Does NOT create one — creation is lazy and only happens via POST.
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
// Lazily creates a Dedicated Virtual Account for the caller the first time
// it's requested. Idempotent — if one already exists it's returned as-is,
// Paystack is never called again for that user.
//
// Body (optional): { phone } — only needed the first time, if the user has
// no phone_number on file yet (Paystack requires one to create the DVA).
export async function POST(req) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.PAYSTACK_SECRET_KEY) {
    console.error("❌ PAYSTACK_SECRET_KEY is not configured");
    return NextResponse.json(
      { error: "Payments are not configured" },
      { status: 500 },
    );
  }

  // Already exists — one permanent DVA per user, never recreate.
  const existing = await pool.query(
    `SELECT account_number, account_name, bank_name, currency, active
     FROM user_virtual_accounts WHERE user_id = $1`,
    [user.id],
  );
  if (existing.rows.length > 0) {
    return NextResponse.json({ virtualAccount: existing.rows[0] });
  }

  let phone = null;
  try {
    const body = await req.json();
    phone = body?.phone || null;
  } catch {
    // no body sent — fine, we'll fall back to the user's stored phone_number
  }

  const userRes = await pool.query(
    `SELECT id, first_name, surname, username, email, phone_number
     FROM users WHERE id = $1`,
    [user.id],
  );
  const dbUser = userRes.rows[0];
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Paystack requires a phone number to create the underlying customer/DVA.
  // We don't ask for BVN/NIN — just first/last name, email, and phone.
  if (!dbUser.phone_number && !phone) {
    return NextResponse.json(
      { error: "phone_required", message: "A phone number is required to set up bank transfer funding." },
      { status: 400 },
    );
  }

  const phoneToUse = dbUser.phone_number || phone;

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

  // Paystack needs a non-empty last name — some Google sign-ups have a blank
  // surname, so fall back to the username rather than sending "".
  const lastName = dbUser.surname?.trim() || dbUser.username;
  const firstName = dbUser.first_name?.trim() || dbUser.username;

  try {
    // 1. Find or create the Paystack customer for this user.
    let customerCode;
    let customerId;

    const lookupRes = await fetch(
      `${PAYSTACK_BASE_URL}/customer/${encodeURIComponent(dbUser.email)}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } },
    );
    const lookupData = await lookupRes.json();

    if (lookupRes.ok && lookupData.status && lookupData.data) {
      customerCode = lookupData.data.customer_code;
      customerId = lookupData.data.id;
    } else {
      const createRes = await fetch(`${PAYSTACK_BASE_URL}/customer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: dbUser.email,
          first_name: firstName,
          last_name: lastName,
          phone: phoneToUse,
        }),
      });
      const createData = await createRes.json();

      if (!createRes.ok || !createData.status) {
        console.error("❌ Paystack customer creation failed:", createData);
        return NextResponse.json(
          { error: createData.message || "Unable to set up bank transfer funding right now." },
          { status: 400 },
        );
      }

      customerCode = createData.data.customer_code;
      customerId = createData.data.id;
    }

    // 2. Create the Dedicated Virtual Account for that customer.
    const dvaRes = await fetch(`${PAYSTACK_BASE_URL}/dedicated_account`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer: customerCode,
        preferred_bank: PREFERRED_BANK,
      }),
    });
    const dvaData = await dvaRes.json();

    if (!dvaRes.ok || !dvaData.status) {
      const message = dvaData?.message || "";
      const notEnabled =
        /not\s*enabled|not\s*available|contact\s*support|integration/i.test(message);

      console.error("❌ Paystack DVA creation failed:", dvaData);

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

    const account = dvaData.data;
    const bankName = account?.bank?.name || "Unknown Bank";
    const accountNumber = account?.account_number;
    const accountName = account?.account_name;
    const dvaId = account?.id;

    if (!accountNumber || !accountName || !dvaId) {
      console.error("❌ Unexpected Paystack DVA response shape:", dvaData);
      return NextResponse.json(
        { error: "Unable to set up bank transfer funding right now." },
        { status: 400 },
      );
    }

    // 3. Persist it. ON CONFLICT guards against a race between two
    // near-simultaneous requests from the same user (unique on user_id).
    const insertRes = await pool.query(
      `INSERT INTO user_virtual_accounts
       (user_id, paystack_customer_code, paystack_customer_id, dva_id, account_number, account_name, bank_name, bank_slug, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING account_number, account_name, bank_name, currency, active`,
      [
        user.id,
        customerCode,
        customerId,
        dvaId,
        accountNumber,
        accountName,
        bankName,
        PREFERRED_BANK,
        account?.currency || "NGN",
      ],
    );

    if (insertRes.rows.length > 0) {
      return NextResponse.json({ virtualAccount: insertRes.rows[0] });
    }

    // Lost the race — a row for this user already exists now. Return that
    // one instead. (The DVA we just created with Paystack above is an orphan
    // in this rare case; it isn't linked to a users_transactions credit path
    // since crediting only ever happens via account_number lookup.)
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