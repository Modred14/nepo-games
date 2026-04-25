
import { saveOTP } from "@/lib/otpStore";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone is required" });
  }

  try {
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