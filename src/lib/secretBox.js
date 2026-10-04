// ROUTE: src/lib/secretBox.js
// src/lib/secretBox.js
//
// Application-level encryption (AES-256-GCM) for data that must not be
// readable by anyone who merely gets a database dump / read access to Neon —
// currently the game-account credentials in login_deliveries.details.
//
// Stored format:  enc:v1:<iv b64>:<authTag b64>:<ciphertext b64>
// Rows written before this change are plaintext; decryptSecret() returns any
// value that doesn't carry the "enc:v1:" prefix unchanged, so old rows keep
// working. Run `node scripts/encrypt-existing-login-details.js` once to
// convert them.
//
// Key: LOGIN_DETAILS_ENCRYPTION_KEY = 32 random bytes, base64 or hex
//      (generate with: openssl rand -base64 32). Losing the key makes the
//      encrypted credentials unrecoverable — back it up in your secret manager.
import crypto from "crypto";

const PREFIX = "enc:v1:";

function getKey() {
  const raw = process.env.LOGIN_DETAILS_ENCRYPTION_KEY;
  if (!raw) return null;
  let buf;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) buf = Buffer.from(raw, "hex");
  else buf = Buffer.from(raw, "base64");
  return buf.length === 32 ? buf : null;
}

export function encryptionConfigured() {
  return getKey() !== null;
}

export function encryptSecret(plaintext) {
  const key = getKey();
  if (!key) throw new Error("LOGIN_DETAILS_ENCRYPTION_KEY is missing or not 32 bytes");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function isEncrypted(value) {
  return typeof value === "string" && value.startsWith(PREFIX);
}

export function decryptSecret(value) {
  if (!isEncrypted(value)) return value; // legacy plaintext row
  const key = getKey();
  if (!key) throw new Error("LOGIN_DETAILS_ENCRYPTION_KEY is missing or not 32 bytes");
  const [ivB64, tagB64, ctB64] = value.slice(PREFIX.length).split(":");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

// Decrypts the `details` field of a login_deliveries row without ever
// throwing into a request handler.
export function withDecryptedDetails(row) {
  if (!row) return row;
  try {
    return { ...row, details: decryptSecret(row.details) };
  } catch (err) {
    console.error("login details decrypt failed:", err.message);
    return { ...row, details: "Unable to decrypt — contact support." };
  }
}
