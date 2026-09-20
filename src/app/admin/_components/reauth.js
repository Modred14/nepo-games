// src/app/admin/_components/reauth.js  (NEW)
//
// ADMIN DASHBOARD: shared client-side helper for the two re-auth-gated
// actions (transaction release/refund, granting super_admin — see
// src/lib/reauth.js and src/app/api/admin/reauth/route.js). Prompts for
// the admin's password/PIN, exchanges it for a short-lived token via
// POST /api/admin/reauth, and returns that token for the caller to
// attach as the `x-reauth-token` header on the actual sensitive
// request. Returns null if the admin cancels or re-auth fails — callers
// should treat null as "abort the action", not retry silently.
export async function requestReauth(action) {
  const credential = window.prompt(
    "Confirm your password (or withdrawal PIN if you signed up with Google) to continue:",
    "",
  );
  if (!credential) return null;

  try {
    const res = await fetch("/api/admin/reauth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential, action }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || "Re-authentication failed");
      return null;
    }
    return data.token;
  } catch (err) {
    alert("Re-authentication request failed. Try again.");
    return null;
  }
}