<!-- ROUTE: docs/SECURITY-AUDIT.md -->
# Nepogames — pre-launch security audit (summary)

Confidence key: **VERIFIED** (read in code / compiled) · **LIKELY** (needs runtime test) · **UNVERIFIED** · **EXTERNAL** (outside the repo).
Nothing below was executed against a real database, Flutterwave, Redis, Cloudinary, Resend or Termii.

## 1. Architecture / auth map
- Next.js 16 (JS) on Fly.io; Neon Postgres via `pg`; NextAuth v4 JWT sessions (7 days); Flutterwave payments; Cloudinary images; Resend email; Termii SMS; Gemini support bot; external socket + transfer service (not in this repo).
- Every protected route calls `requireUser()` / `requireAdmin()` / `requireSuperAdmin()` (src/lib/auth.js). `requireUser()` now re-reads role/plan/status from the DB on each call instead of trusting the JWT.

## 2. Transaction state machine (as implemented)
| Step | Table state after | Who / how |
|---|---|---|
| Listing created | `listings.status='active'`, moderation pending→approved | verified seller (phone_verified) |
| Buy (card) | `transactions` payment `pending`, tx `initiated`; listing `processing`, `processing_by=buyer` | buyer; price/fee read from DB under row lock |
| Buy (wallet) | tx `completed`/escrow `holding`, payment `paid`; listing `pending` | buyer; user row locked, balance from ledger |
| Webhook charge success | payment `paid`, tx `pending`, escrow `holding`; listing `pending` | Flutterwave, re-verified server-side, idempotent |
| Seller sends login | `login_deliveries` row (encrypted), `expires_at = now + window` | seller of that listing only; once per conversation |
| Buyer confirms | delivery `confirmed`; escrow released to seller | buyer only, before expiry |
| Buyer disputes | delivery `disputed`; escrow `frozen` | buyer only, before expiry |
| Window expires | cron releases to seller if not disputed/frozen | `CRON_SECRET` bearer |
| Admin resolve | release_seller / refund_buyer | admin (+ re-auth token) |
| Cancel unpaid | tx `cancelled/failed`; listing reopened only if still reserved for that buyer | buyer, admin, stale-checkout sweeper |

Illegal transitions checked: unpaid→completed (blocked: only verified webhook/wallet debit sets `paid`), double payout (idempotent claims + `FOR UPDATE`), disputed→payout (cron/confirm skip frozen/disputed), cross-user access (participant + order binding), cancelled→paid (webhook refunds to wallet instead). **Not verified:** the external transfer service that actually moves money to banks.

## 3. Findings fixed (severity · confidence)
| # | Sev | Finding | Where | Fix |
|---|---|---|---|---|
| 1 | Critical | Client-controlled `session.update()` merged into JWT → impersonation/admin | nextauth route | token refreshed from DB only |
| 2 | Critical | `checkdetails` returned credentials to any user (IDOR) | c/[slug]/checkdetails | participant check |
| 3 | Critical | Subscription verify accepted any paid ref, replayable | paystack/verify | ref bound to user, amount check, idempotent |
| 4 | Critical | Webhook trusted request body for amount/status | paystack/webhook | verify with Flutterwave, tx_ref-derived purpose |
| 5 | Critical | Escrow cron open when `CRON_SECRET` unset | cron/release-escrow | mandatory, constant-time |
| 6 | High | Seller could post delivery into any conversation | senddetails | order + participant binding |
| 7 | High | Wallet double-spend race | buy/initialize | user-row lock |
| 8 | High | Buyer cancel re-activated arbitrary listing | transactions/cancel | listing derived from tx |
| 9 | High | Admin cancel of PAID order (no refund) | admin/transactions/[id]/cancel | unpaid only |
| 10 | High | No brute-force limits (login/OTP/reset/signup) | many | atomic rate limiter, fail-closed |
| 11 | High | Unauthenticated email/SMS relays | send-email-otp, seller/welcome | auth + own address |
| 12 | High | Support chat sessions readable by id; public Gemini proxy | api/chat/* | signed cookie ownership; admin-only models |
| 13 | High | Credentials/BVN plaintext at rest | login_deliveries, users.bvn | AES-256-GCM |
| 14 | Medium | Any admin could ban another admin; unvalidated platform settings (fee 1000%, negative) | admin/users/status, settings | role rule + validators |
| 15 | Medium | DB TLS validation off; no security headers/CSP | db.js, next.config.mjs | enabled |
| 16 | Medium | Seller/contestant email exposed publicly | game page, tournaments | removed/masked |
| 17 | Medium | Build broken (missing module, corrupted file) | subscriptions.js, game page | fixed |

## 4. Remaining risks (be skeptical)
- **EXTERNAL**: Flutterwave webhook secret hash, Redis, Fly secrets, DNS/HSTS, Cloudinary upload presets, Resend/Termii sender config.
- **UNVERIFIED**: transfer/socket service; DB constraints not in repo (base schema missing); webhook behaviour with real Flutterwave payloads (field names `meta`, `tx_ref`, `status`).
- **LIKELY**: CSP uses `'unsafe-inline'` scripts; browser-side payment redirect flows need a manual end-to-end test.
- Refunded/disputed listings are left `pending` (never re-listed automatically) — safe, but admin tooling to relist is manual.
- **Legal (QUALIFIED LEGAL ADVICE)**: game-publisher ToS on account transfers; consumer-protection and refund duties; Nigerian data-protection duties (NDPA) for BVN/phone/email; whether escrow-like holding needs a payment licence/partner; age limits; trademark use of game names/logos. I have not asserted any specific law or licence requirement.

## 5. Manual test checklist before launch
1. Pay with a test card → order paid, chat message appears; replay the same webhook → no second effect.
2. Pay after cancelling checkout → wallet refund, order stays cancelled.
3. Two browsers: buy two listings at once with a wallet that can afford one.
4. User A requests `/api/c/<B's conv>/checkdetails` → 403.
5. Login 10× wrong password → 15-minute lockout message.
6. Admin: set seller fee to `-1` and `100` → rejected.
