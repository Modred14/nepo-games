// ROUTE: src/lib/chatSession.js
// src/lib/chatSession.js
//
// Support-chat sessions are addressed by a small sequential integer, so the
// id alone must never grant access (anyone could read other people's support
// transcripts, or burn our AI quota by posting into them). A session is
// "owned" by whoever holds the signed, HttpOnly cookie issued when it was
// created, or by the logged-in account that created it. Admins may access
// every session.
import crypto from "crypto";
import pool from "./db";
import { requireUser } from "./auth";

export const CHAT_COOKIE = "nepo_chat_sid";

function sign(sessionId) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return crypto.createHmac("sha256", secret).update(`chat:${sessionId}`).digest("hex");
}

export function chatCookieValue(sessionId) {
  return `${sessionId}.${sign(sessionId)}`;
}

export function chatCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/chat",
    maxAge: 60 * 60 * 24 * 7,
  };
}

function readCookie(req, name) {
  const header = req.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

function cookieMatches(req, sessionId) {
  const raw = readCookie(req, CHAT_COOKIE);
  if (!raw) return false;
  const [id, mac] = raw.split(".");
  if (String(id) !== String(sessionId) || !mac) return false;
  const expected = sign(sessionId);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Returns { ok, isAdmin, user, session } — never throws on bad input.
export async function authorizeChatSession(req, rawSessionId, { allowDeleted = false } = {}) {
  const sessionId = Number(rawSessionId);
  if (!Number.isInteger(sessionId) || sessionId <= 0) return { ok: false };

  const res = await pool.query(
    `SELECT * FROM chat_sessions WHERE id = $1 ${allowDeleted ? "" : "AND deleted_at IS NULL"}`,
    [sessionId],
  );
  const session = res.rows[0];
  if (!session) return { ok: false };

  const user = await requireUser();
  const isAdmin = user?.role === "admin";
  const isOwnerUser = user && session.user_id != null && Number(session.user_id) === Number(user.id);

  if (isAdmin || isOwnerUser || cookieMatches(req, sessionId)) {
    return { ok: true, isAdmin, user, session };
  }
  return { ok: false };
}
