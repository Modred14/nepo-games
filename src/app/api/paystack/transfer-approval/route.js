// ORIGINAL ROUTE: src/app/api/paystack/transfer-approval/route.js
// ⚠️ NOT A DIRECT CONVERSION — Flutterwave has no equivalent to this.
//
// This route existed because Paystack lets you register a synchronous
// "Transfer Approval URL" that stands in for the OTP prompt: Paystack calls
// this URL DURING transfer initiation and expects a 200/400 response within
// seconds, deciding right then whether to proceed.
//
// Flutterwave's transfer flow doesn't have a synchronous pre-approval hook
// like this. Instead, Flutterwave transfers are approved/processed
// server-side after you call POST /v3/transfers, and you find out the
// outcome asynchronously via the transfer.completed webhook (already
// handled in the updated src/app/api/paystack/webhook/route.js).
//
// What this means for your withdraw flow (src/app/api/user/withdraw/route.js):
// the validation this route used to do synchronously — confirming the
// reference/amount match a real pending withdrawal in YOUR OWN database
// before Paystack actually moves money — now has to happen BEFORE you call
// Flutterwave's /v3/transfers endpoint, not as a separate webhook Flutterwave
// calls back into. The updated withdraw/route.js already does this (it
// creates and validates the pending users_transactions row first, then
// calls Flutterwave), so the actual security property this route provided is
// preserved — it just no longer lives in its own endpoint.
//
// Recommendation: delete this route/folder once you're confident the new
// withdraw/route.js covers the same validation, and remove any
// "Transfer Approval URL" setting from your Flutterwave dashboard (there
// isn't one — this is a Paystack-specific dashboard setting, so there's
// nothing to unset there either).
export async function POST() {
  return new Response(
    JSON.stringify({
      error:
        "This endpoint is a Paystack-specific concept (synchronous transfer approval) with no Flutterwave equivalent. It should not be called. See the comment at the top of this file.",
    }),
    { status: 410, headers: { "Content-Type": "application/json" } },
  );
}
