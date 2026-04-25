const otpStore = new Map();

export function saveOTP(phone, otp, userId) {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

  otpStore.set(phone, {
    otp,
    userId,
    expiresAt,
    attempts: 0,
  });
}

export function getOTP(phone) {
  return otpStore.get(phone);
}

export function deleteOTP(phone) {
  otpStore.delete(phone);
}
