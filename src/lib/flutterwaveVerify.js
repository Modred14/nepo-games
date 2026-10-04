// ROUTE: src/lib/flutterwaveVerify.js
// src/lib/flutterwaveVerify.js
//
// Server-to-server verification of Flutterwave charges. A webhook body, a
// browser redirect, or a client-supplied reference is NEVER proof of payment
// on its own — the transaction is always re-fetched from Flutterwave using
// the secret key before any money-affecting state changes.
const FLW_BASE = "https://api.flutterwave.com/v3";

async function flwGet(path) {
  try {
    const res = await fetch(`${FLW_BASE}${path}`, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
      signal: AbortSignal.timeout(12000),
    });
    // 5xx / 429 are transient: caller should retry later, not conclude
    // anything about the payment.
    if (res.status >= 500 || res.status === 429) return { status: "error" };
    const json = await res.json().catch(() => null);
    if (!json) return { status: "error" };
    if (json.status === "success" && json.data) {
      return { status: "ok", data: json.data };
    }
    return { status: "notfound" };
  } catch (err) {
    console.error("Flutterwave verify request failed:", err.message);
    return { status: "error" };
  }
}

// -> { status: "ok", data } | { status: "notfound" } | { status: "error" }
export function verifyByReference(reference) {
  return flwGet(
    `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
  );
}

export function verifyById(id) {
  return flwGet(`/transactions/${encodeURIComponent(id)}/verify`);
}

// Idempotency guard shared by the webhook and the browser-return verify
// route. Returns true only the FIRST time (event_type, reference) is seen.
// Must be called inside the same DB transaction as the effect it guards, so
// a crash rolls back both together.
export async function markProcessed(client, eventType, reference) {
  const res = await client.query(
    `INSERT INTO paystack_webhook_events (event_type, reference)
     VALUES ($1, $2)
     ON CONFLICT (event_type, reference) DO NOTHING
     RETURNING id`,
    [eventType, reference],
  );
  return res.rows.length > 0;
}

// Parses OUR OWN tx_ref formats (we generate every one of them):
//   sub_<userId>_<plan>_<ts>
//   wallet_<userId>_<ts>
//   tx_<transactionId>_<ts>
//   tournament_<tournamentId>_<userId>_<ts>
// The reference is the authority for what a payment was for; `meta` is only
// used as a cross-check.
export function parseTxRef(reference) {
  if (typeof reference !== "string") return null;
  let m;
  if ((m = /^sub_(\d+)_(pro|plus|premium)_(\d+)$/.exec(reference))) {
    return { purpose: "subscription", userId: Number(m[1]), plan: m[2] };
  }
  if ((m = /^wallet_(\d+)_(\d+)$/.exec(reference))) {
    return { purpose: "wallet", userId: Number(m[1]) };
  }
  if ((m = /^tx_(\d+)_(\d+)$/.exec(reference))) {
    return { purpose: "marketplace", transactionId: Number(m[1]) };
  }
  if ((m = /^tournament_(\d+)_(\d+)_(\d+)$/.exec(reference))) {
    return {
      purpose: "tournament",
      tournamentId: Number(m[1]),
      userId: Number(m[2]),
    };
  }
  return null;
}

// Credits a user's wallet for money that reached us but cannot be applied to
// the order it was meant for (late payment on a cancelled order, listing
// already gone, wrong amount...). Safer than silently keeping the money.
export async function creditWalletRefund(client, userId, amount, reference, description) {
  await client.query(
    `INSERT INTO users_transactions
       (user_id, type, amount, status, description, reference, affects_balance)
     VALUES ($1, 'credit', $2, 'success', $3, $4, true)`,
    [userId, amount, description, `latepay_${reference}`],
  );
}
