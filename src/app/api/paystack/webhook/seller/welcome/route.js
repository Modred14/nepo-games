// ROUTE: src/app/api/paystack/webhook/seller/welcome/route.js
// RETIRED — moved to the authenticated /api/seller/welcome. Left as a stub so
// the old unauthenticated mail-relay endpoint no longer exists.
export async function POST() {
  return Response.json({ error: "Gone" }, { status: 410 });
}
