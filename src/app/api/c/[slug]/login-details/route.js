// ROUTE: src/app/api/c/[slug]/login-details/route.js
//
// DISABLED. This was a legacy duplicate of /senddetails with no caller in the
// codebase. It never worked (it read `params.conversationId` from a
// `[slug]` route and matched an escrow state, 'held', that nothing sets) and
// it could insert login deliveries and system messages into arbitrary
// conversations. The supported path is POST /api/c/[slug]/senddetails.
export async function POST() {
  return Response.json(
    { error: "This endpoint has been retired. Use /senddetails." },
    { status: 410 },
  );
}
