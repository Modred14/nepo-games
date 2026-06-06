import { NextResponse } from "next/server";
import pool from "@/lib/db";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let ensureTablePromise;

function ensureWaitlistTable() {
  ensureTablePromise ??= pool.query(`
    CREATE TABLE IF NOT EXISTS waitlist (
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
        { message: "Valid email is required" },
        { status: 400 },
      );
    }

    await ensureWaitlistTable();

    const result = await pool.query(
      `INSERT INTO waitlist (email)
       VALUES ($1)
       ON CONFLICT (email) DO NOTHING
       RETURNING email`,
      [normalizedEmail],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: "You're already on the waitlist!" },
        { status: 409 },
      );
    }

    return NextResponse.json({ message: "Added to waitlist." }, { status: 201 });
  } catch (err) {
    console.error("Waitlist error:", err);
    return NextResponse.json(
      { message: "Server error." },
      { status: 500 },
    );
  }
}