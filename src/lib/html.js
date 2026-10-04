// ROUTE: src/lib/html.js
// src/lib/html.js
// Minimal HTML escaping for values interpolated into email HTML.
// User-controlled strings (names, listing titles, emails) must never be
// placed into email markup unescaped — that is HTML injection into mail
// that is sent from our own domain.
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Masks an email for display to a counterparty: ab***z@domain.com
export function maskEmail(email) {
  if (typeof email !== "string" || !email.includes("@")) return "";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0] || ""}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}
