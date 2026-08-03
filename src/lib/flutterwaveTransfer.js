// nepo-games-main/src/lib/flutterwaveTransfer.js
//
// Flutterwave's /v3/transfers endpoint requires the calling server's IP to
// be whitelisted on the Flutterwave dashboard. Netlify Functions don't have
// a static outbound IP (their egress rotates across a shared AWS pool), so
// calling Flutterwave directly from here can never pass whitelisting
// reliably. Render can be given a static outbound IP, so this helper sends
// the transfer request to nepo-games-server-main's /transfer endpoint
// instead, which makes the actual call to Flutterwave from that
// whitelisted IP. Mirrors the existing emitToRoom() pattern in
// src/lib/socket.js (same SOCKET_SERVER_URL host, separate shared secret).

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
    return { ok: false, data: { message: "Transfer service not configured" } };
  }

  const secret = process.env.TRANSFER_SECRET;
  if (!secret) {
    console.error(
      "[requestFlutterwaveTransfer] ERROR: TRANSFER_SECRET is not set!",
    );
    return { ok: false, data: { message: "Transfer service not configured" } };
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

    return { ok: res.ok, data };
  } catch (err) {
    console.error(
      "[requestFlutterwaveTransfer] Fetch threw an error:",
      err.message,
    );
    return { ok: false, data: { message: "Transfer request failed" } };
  }
}