// src/app/api/paystack/resolve-account/route.js
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function POST(req) {
  try {
    // FIX (high): this route had no auth check at all — anyone, logged in
    // or not, could POST any accountNumber/bankCode and get back the real
    // account holder's name via your Paystack credentials. That's both a
    // privacy problem (a free "whose bank account is this" lookup tool for
    // the whole internet) and a cost/abuse vector against your own
    // Paystack API usage.
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
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
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
      bankId: data.data.bank_id,
    });
  } catch (err) {
    console.error("Account resolve error:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}