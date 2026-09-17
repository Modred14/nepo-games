// nepo-games-main/src/lib/flutterwaveTransfer.js
//
// Flutterwave's /v3/transfers endpoint (and the GET status-check endpoints
// used for reconciliation, see checkFlutterwaveTransferStatus below)
// require the calling server's IP to be whitelisted on the Flutterwave
// dashboard. Netlify Functions don't have a static outbound IP (their
// egress rotates across a shared AWS pool), so calling Flutterwave
// directly from here can never pass whitelisting reliably. Render can be
// given a static outbound IP, so this helper sends requests to
// nepo-games-server-main's /transfer and /transfer-status endpoints
// instead, which make the actual calls to Flutterwave from that
// whitelisted IP. Mirrors the existing emitToRoom() pattern in
// src/lib/socket.js (same SOCKET_SERVER_URL host, separate shared secret).
//
// FIX (audit item D.1, critical): requestFlutterwaveTransfer() now
// distinguishes two very different failure modes instead of collapsing
// them both into `{ ok: false }`:
//   1. Flutterwave responded (even with a rejection) — we have a
//      definitive answer, safe to treat as a clean failure.
//   2. The request never got a response at all (network error/timeout
//      between Next.js and Render, or between Render and Flutterwave) —
//      we do NOT know whether Flutterwave actually received and queued
//      the transfer. Treating this the same as (1) is what allowed a
//      withdrawal to be marked 'failed' (freeing the user's balance to
//      retry) while the original transfer may have already gone out —
//      a double-payout risk. This case is now flagged `ambiguous: true`
//      so the caller can reconcile instead of guessing.

export async function requestFlutterwaveTransfer({
  account_bank,
  account_number,
  amount,
  currency = "NGN",
  narration = "Wallet withdrawal",
  reference,
}) {
  const socketServerUrl = process.env.SOCKET_SERVER_URL;

  if (!socketServerUrl) {
    console.error(
      "[requestFlutterwaveTransfer] ERROR: SOCKET_SERVER_URL is not set!",
    );
    // Config errors are NOT ambiguous — we know for certain the request
    // never left this process, so Flutterwave was never contacted.
    return {
      ok: false,
      ambiguous: false,
      data: { message: "Transfer service not configured" },
    };
  }

  const secret = process.env.TRANSFER_SECRET;
  if (!secret) {
    console.error(
      "[requestFlutterwaveTransfer] ERROR: TRANSFER_SECRET is not set!",
    );
    return {
      ok: false,
      ambiguous: false,
      data: { message: "Transfer service not configured" },
    };
  }

  try {
    const res = await fetch(`${socketServerUrl}/transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-transfer-secret": secret,
      },
      body: JSON.stringify({
        account_bank,
        account_number,
        amount,
        currency,
        narration,
        reference,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(
        "[requestFlutterwaveTransfer] Transfer failed:",
        res.status,
        data,
      );
    }

    // The proxy itself can tell us its own fetch to Flutterwave threw
    // (see index.js's /transfer catch block) — it marks that
    // `ambiguous: true` in the JSON body it returns. A normal
    // success/rejection response from Flutterwave (forwarded as-is) has
    // no such flag, so it defaults to false: we got a real answer.
    return { ok: res.ok, ambiguous: Boolean(data?.ambiguous), data };
  } catch (err) {
    // We never even got an HTTP response back from Render — could be a
    // Netlify function timeout, DNS hiccup, Render cold-start crash,
    // etc. This is the ambiguous case: Render may have already reached
    // Flutterwave before this failed.
    console.error(
      "[requestFlutterwaveTransfer] Fetch threw an error:",
      err.message,
    );
    return {
      ok: false,
      ambiguous: true,
      data: { message: "Transfer request failed" },
    };
  }
}

// FIX (audit item D.1/D.2, critical): reconciliation helper. Used in two
// places:
//   - withdraw/route.js, when requestFlutterwaveTransfer() comes back
//     ambiguous, to find out what Flutterwave actually did before
//     deciding whether it's safe to mark the withdrawal 'failed' (and
//     thus free up the user's balance for a retry).
//   - the transfer.completed webhook handler, to re-verify the webhook
//     body's status against Flutterwave's own records rather than
//     trusting the POST body directly (mirrors the existing
//     verifyByReference() pattern already used for charge.completed).
//
// Goes through the same whitelisted-IP Render proxy as the transfer
// itself, since GET /v3/transfers is also covered by Flutterwave's
// mandatory IP whitelist.
export async function checkFlutterwaveTransferStatus({ reference, id } = {}) {
  const socketServerUrl = process.env.SOCKET_SERVER_URL;
  const secret = process.env.TRANSFER_SECRET;

  if (!socketServerUrl || !secret) {
    console.error(
      "[checkFlutterwaveTransferStatus] ERROR: transfer service not configured",
    );
    return { ok: false, found: false, ambiguous: true, data: null };
  }

  if (!reference && !id) {
    throw new Error("checkFlutterwaveTransferStatus requires reference or id");
  }

  const qs = id
    ? `id=${encodeURIComponent(id)}`
    : `reference=${encodeURIComponent(reference)}`;

  try {
    const res = await fetch(`${socketServerUrl}/transfer-status?${qs}`, {
      method: "GET",
      headers: { "x-transfer-secret": secret },
    });

    const data = await res.json();

    if (Boolean(data?.ambiguous)) {
      // The proxy reached out but couldn't get an answer from
      // Flutterwave either — still unresolved, not "not found".
      return { ok: false, found: false, ambiguous: true, data };
    }

    // Flutterwave's GET /v3/transfers?reference=... returns a list in
    // `data` when queried by reference, or a single object when queried
    // by id. Normalize to a single record (the most recent one) so
    // callers don't have to care which query form was used.
    const record = Array.isArray(data?.data) ? data.data[0] : data?.data;

    if (!res.ok || !record) {
      // A clean "not found" from Flutterwave — genuinely no transfer was
      // ever created with this reference. Safe to treat as failed.
      return { ok: res.ok, found: false, ambiguous: false, data };
    }

    return { ok: true, found: true, ambiguous: false, data: record };
  } catch (err) {
    console.error(
      "[checkFlutterwaveTransferStatus] Fetch threw an error:",
      err.message,
    );
    return { ok: false, found: false, ambiguous: true, data: null };
  }
}