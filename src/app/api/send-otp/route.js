import { saveOTP } from "@/lib/otpStore";
import crypto from "crypto";
import pool from "@/lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone is required" });
  }

  try {
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE phone_number = $1 LIMIT 1",
      [phone],
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: "Phone number already in use",
      });
    }
    // ✅ Generate OTP on server
    const otp = crypto.randomInt(100000, 1000000).toString();

    // ✅ Store it
    saveOTP(phone, otp);

    // ✅ Send SMS
    const response = await fetch("https://api.termii.com/api/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        from: "Modred",
        sms: `Your verification code is ${otp}. It expires in 5 minutes.`,
        type: "plain",
        channel: "generic",
        api_key: process.env.TERMII_API_KEY,
      }),
    });

    const data = await response.json();

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to send OTP" });
  }
}
