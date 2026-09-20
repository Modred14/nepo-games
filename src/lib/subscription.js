// src/lib/subscriptions.js  (NEW)
//
// ADMIN DASHBOARD PHASE 5: extracted from
// src/app/api/paystack/webhook/route.js, which computes a user's plan
// tier from TOTAL days of subscription remaining (not from whichever
// plan was just purchased — e.g. buying Pro while 400 days of Premium
// are already banked should stay Premium, not downgrade). Admin actions
// that grant/extend subscription time need to follow the exact same
// rule, or an admin-granted extension could silently disagree with what
// the next real payment would compute. Both places now import this
// single function instead of keeping two copies in sync by hand.
export function derivePlanFromDays(totalDays) {
  if (totalDays <= 0) return "free";
  if (totalDays <= 90) return "pro";
  if (totalDays <= 365) return "plus";
  return "premium";
}

// Duration presets matching PLAN_BY_AMOUNT in webhook/route.js (the
// actual paid durations), offered as quick-grant shortcuts in the admin
// UI — see src/app/admin/subscriptions/page.jsx.
export const PLAN_DURATION_PRESETS = [
  { label: "Pro — 30 days", days: 30 },
  { label: "Plus — 90 days", days: 90 },
  { label: "Premium — 365 days", days: 365 },
];