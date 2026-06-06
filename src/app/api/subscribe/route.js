import { NextResponse } from "next/server";
import pool from "@/lib/db";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let ensureTablePromise;

function ensureSubscribersTable() {
  ensureTablePromise ??= pool.query(`
    CREATE TABLE IF NOT EXISTS subscribers (
      email TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  return ensureTablePromise;
}

export async function POST(req) {
  try {
    const { email } = await req.json();
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }

    await ensureSubscribersTable();
    await pool.query(
      `INSERT INTO subscribers (email)
       VALUES ($1)
       ON CONFLICT (email) DO NOTHING`,
      [normalizedEmail],
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
