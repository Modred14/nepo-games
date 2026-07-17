// src/lib/socketAuth.js
import jwt from "jsonwebtoken";


const SECRET = process.env.SOCKET_SECRET;
const TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes

export function signSocketJoinToken(payload) {
  if (!SECRET) {
    throw new Error("SOCKET_SECRET is not set");
  }
  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_TTL_SECONDS });
}

export function verifySocketJoinToken(token) {
  if (!SECRET) return null;
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}