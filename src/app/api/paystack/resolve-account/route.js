// ORIGINAL ROUTE: src/app/api/paystack/resolve-account/route.js
// CHANGED: Paystack GET /bank/resolve -> Flutterwave POST /v3/accounts/resolve
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountNumber, bankCode } = await req.json();

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { error: "Account number and bank code are required" },
        { status: 400 },
      );
    }

    const response = await fetch(
      "https://api.flutterwave.com/v3/accounts/resolve",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_number: accountNumber,
          account_bank: bankCode,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      return NextResponse.json(
        {
          error: data.message || "Unable to resolve account",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      accountName: data.data.account_name,
      accountNumber: data.data.account_number,
      // Flutterwave's resolve endpoint doesn't return a bank_id the way
      // Paystack's did — omit it; nothing downstream in this codebase used
      // bankId from this response other than passing it back to the client,
      // which didn't use it either.
    });
  } catch (err) {
    console.error("Account resolve error:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
