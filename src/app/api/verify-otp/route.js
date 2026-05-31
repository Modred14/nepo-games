import { getOTP, deleteOTP } from "@/lib/otpStore";
import pool from "@/lib/db";
import { requireUser } from "@/lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
  const user = await requireUser(); // ✅ reads from JWT
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: "Phone and OTP required" });
    }

    const record = getOTP(phone);

    if (!record) {
      return res.status(400).json({ error: "OTP not found" });
    }

    // ❌ Expired
    if (Date.now() > record.expiresAt) {
      deleteOTP(phone);
      return res.status(400).json({ error: "OTP expired" });
    }

    // ❌ Wrong OTP
    if (record.otp !== otp) {
      record.attempts += 1;

      if (record.attempts >= 5) {
        deleteOTP(phone);
        return res.status(400).json({ error: "Too many attempts" });
      }

      return res.status(400).json({ error: "Invalid OTP" });
    }

    // ✅ update user
    await pool.query(
      `UPDATE users 
       SET phone_verified = true, phone = $1
       WHERE id = $2`,
      [phone, userId],
    );

    // 🧹 cleanup
    deleteOTP(phone);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
