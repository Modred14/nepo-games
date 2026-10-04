// ROUTE: src/lib/subscriptions.js
// src/lib/subscriptions.js
//
// FIX (build blocker): paystack/webhook/route.js and
// admin/subscriptions/[userId]/extend/route.js import "@/lib/subscriptions",
// but the repository only contained src/lib/subscription.js, so
// `next build` failed with "Module not found" — the payment webhook could not
// be deployed. This is the real module; subscription.js now re-exports it.
//
// Derives the plan TIER from total days remaining (not from whichever plan
// was just purchased), so buying Pro while 400 days of Premium remain stays
// Premium.
export function derivePlanFromDays(totalDays) {
  if (totalDays <= 0) return "free";
  if (totalDays <= 90) return "pro";
  if (totalDays <= 365) return "plus";
  return "premium";
}

// Server-side price list — the ONLY authority for subscription prices.
export const PLAN_PRICES = { pro: 2900, plus: 8500, premium: 32000 };
export const PLAN_DAYS = { pro: 30, plus: 90, premium: 365 };

// Duration presets offered as quick-grant shortcuts in the admin UI.
export const PLAN_DURATION_PRESETS = [
  { label: "Pro — 30 days", days: 30 },
  { label: "Plus — 90 days", days: 90 },
  { label: "Premium — 365 days", days: 365 },
];

// Applies a verified subscription payment inside the caller's DB transaction.
// Shared by the Flutterwave webhook and the browser-return verify route so
// the same reference can only ever grant time ONCE, whichever arrives first.
// Caller is responsible for BEGIN/COMMIT and for having verified the payment
// (status, currency, amount) with Flutterwave.
export async function applySubscriptionPayment(
  client,
  { userId, plan, reference, amount, markProcessed },
) {
  const days = PLAN_DAYS[plan];
  if (!days) throw new Error("Invalid plan");

  const isNew = await markProcessed(client, "charge.success.subscription", reference);
  if (!isNew) return { applied: false };

  await client.query(
    `INSERT INTO payments (user_id, amount, reference, status)
     VALUES ($1, $2, $3, $4)`,
    [userId, amount, reference, "success"],
  );

  // History-only row: card payments never touch the in-app wallet balance.
  await client.query(
    `INSERT INTO users_transactions
       (user_id, type, amount, status, description, reference, affects_balance)
     VALUES ($1, 'debit', $2, 'success', 'Subscription payment', $3, false)`,
    [userId, amount, reference],
  );

  const existingRes = await client.query(
    `SELECT subscription_end FROM users WHERE id = $1 FOR UPDATE`,
    [userId],
  );
  const now = new Date();
  const currentEnd = existingRes.rows[0]?.subscription_end;
  const startFrom =
    currentEnd && new Date(currentEnd) > now ? new Date(currentEnd) : now;
  const end = new Date(startFrom);
  end.setDate(end.getDate() + days);

  const totalDaysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  const finalPlan = derivePlanFromDays(totalDaysRemaining);

  await client.query(
    `UPDATE users
       SET plan = $1,
           subscription_status = 'active',
           subscription_start = NOW(),
           subscription_end = $2,
           paystack_reference = $3
     WHERE id = $4`,
    [finalPlan, end, reference, userId],
  );

  return { applied: true, finalPlan, end };
}
