// ROUTE: src/app/api/user/withdraw/route.js
// CHANGED: Paystack transferrecipient + /transfer -> Flutterwave /v3/transfers
//
// SIMPLIFICATION: Flutterwave's /v3/transfers takes account_bank +
// account_number + amount directly on every call — there's no separate
// "create a transfer recipient first, then reuse its code" step like
// Paystack's transferrecipient object. So the recipient_code caching logic
// from the original file is removed entirely; we just pass the bank details
// straight through each time. The `users.recipient_code` column is left
// alone (unused now) rather than dropped, to avoid a migration.
//
// Also see the note in src/app/api/paystack/transfer-approval/route.js —
// the synchronous OTP-bypass approval step Paystack had is not a Flutterwave
// concept. This route's own pre-transfer validation (PIN check, balance
// check, pending-row-created-before-calling-the-provider) is what actually
// carries that safety property forward, and is unchanged below.
// UPDATED: the actual call to Flutterwave's /v3/transfers is now proxied
// through nepo-games-server-main's /transfer endpoint (see
// src/lib/flutterwaveTransfer.js) instead of being made directly from here.
// Flutterwave requires the calling IP to be whitelisted, and Netlify
// Functions don't have a static outbound IP, so this route can never pass
// whitelisting on its own. Render can be given a static outbound IP, so
// that's where the outbound call to Flutterwave now happens.
//
// AUDIT FIXES applied in this version:
//
// D.1 (critical, double-payout risk): previously, ANY error from the
// Flutterwave call — including a plain network timeout where we have no
// idea whether Flutterwave actually received and queued the transfer —
// was treated identically to a clean rejection: marked 'failed', which
// frees the user's balance to retry. If Flutterwave had, in fact, already
// queued/executed the original transfer, the user could end up paid out
// twice for one withdrawal. Now, an ambiguous outcome is never marked
// 'failed' directly — we reconcile against Flutterwave's own transfer
// records first (checkFlutterwaveTransferStatus), and only fall back to a
// non-balance-freeing 'unknown' status requiring manual/background
// reconciliation if Flutterwave's answer is itself unavailable.
//
// D.4 (amount type mismatch): Flutterwave's own API reference types the
// transfer `amount` field as an integer (int32). This route now rejects
// non-integer withdrawal amounts server-side instead of forwarding
// whatever decimal value the client sent.
//
// D.5 (silent stuck transfers): Flutterwave can come back with
// `requires_approval: 1` on the queued transfer, meaning it won't proceed
// until someone manually approves it from the Flutterwave dashboard — no
// webhook will ever arrive on its own. This is now detected and an admin
// alert is sent so it doesn't sit invisibly forever.
//
// D.6 (defense in depth): the pending-transaction insert now uses
// ON CONFLICT DO NOTHING against a unique constraint on `reference` (see
// the migration in db/migrations/002_unique_withdrawal_reference.sql). In
// practice the per-user row lock below already makes a reference collision
// vanishingly unlikely, but this closes the gap at the DB level too.
//
// D.7 (record accuracy, not a fund-diversion risk — Flutterwave's transfer
// call never reads account_name, only account_bank/account_number): the
// account name is now re-resolved from Flutterwave at withdrawal time
// instead of trusting whatever string the client submitted, so
// `user_banks.account_name` stays accurate.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import {
  requestFlutterwaveTransfer,
  checkFlutterwaveTransferStatus,
} from "@/lib/flutterwaveTransfer";
import { sendAdminAlert } from "@/lib/emails/sendAdminAlert";

export async function POST(req) {
  const client = await pool.connect();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { accountNumber, bankCode, pin } = body;

    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // FIX (D.4): Flutterwave documents the transfer `amount` field as an
    // integer. Reject decimal/kobo amounts here instead of silently
    // forwarding them and finding out how Flutterwave handles it.
    if (!Number.isInteger(amount)) {
      return NextResponse.json(
        { error: "Withdrawal amount must be a whole number of naira (no kobo)." },
        { status: 400 },
      );
    }

    if (amount < 100) {
      return NextResponse.json(
        { error: "Minimum withdrawal is ₦100.00" },
        { status: 400 },
      );
    }

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { error: "Bank account and bank are required" },
        { status: 400 },
      );
    }

    if (!pin || !/^\d{4}$/.test(String(pin))) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 400 });
    }

    await client.query("BEGIN");

    const userRes = await client.query(
      `
      SELECT id, plan, email, pin_hash, pin_attempts, pin_locked_until
      FROM users
      WHERE email = $1
      FOR UPDATE
      `,
      [session.user.email],
    );

    const user = userRes.rows[0];

    if (!user) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user.id;

    if (user.pin_locked_until && new Date(user.pin_locked_until) > new Date()) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Too many incorrect PIN attempts. Try again later." },
        { status: 429 },
      );
    }

    if (!user.pin_hash) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "No withdrawal PIN set. Please set a PIN first." },
        { status: 400 },
      );
    }

    const isValid = await bcrypt.compare(String(pin), user.pin_hash);

    if (!isValid) {
      const attempts = (user.pin_attempts || 0) + 1;

      if (attempts >= 5) {
        await client.query(
          `UPDATE users
           SET pin_attempts = $1,
               pin_locked_until = NOW() + INTERVAL '15 minutes'
           WHERE id = $2`,
          [attempts, userId],
        );
        await client.query("COMMIT");
        return NextResponse.json(
          { error: "Too many failed attempts. Locked for 15 minutes." },
          { status: 429 },
        );
      }

      await client.query(
        `UPDATE users SET pin_attempts = $1 WHERE id = $2`,
        [attempts, userId],
      );
      await client.query("COMMIT");
      return NextResponse.json({ error: "Incorrect PIN" }, { status: 403 });
    }

    await client.query(
      `UPDATE users SET pin_attempts = 0, pin_locked_until = NULL WHERE id = $1`,
      [userId],
    );

    // FIX (D.3, matching src/app/api/user/account/route.js): both
    // 'pending' AND 'unknown' (see D.1) debits must be counted as
    // already-committed against the balance, or a user could withdraw
    // against money that's actually tied up in an in-flight/ambiguous
    // transfer.
    const balanceRes = await client.query(
      `
      SELECT COALESCE(SUM(
        CASE 
          WHEN type = 'credit' AND status = 'success' THEN amount
          WHEN type = 'debit' AND status IN ('success', 'pending', 'unknown') THEN -amount
          ELSE 0
        END
      ), 0) AS balance
      FROM users_transactions
      WHERE user_id = $1
        AND affects_balance = true
      `,
      [userId],
    );

    const balance = Number(balanceRes.rows[0].balance || 0);

    if (amount > balance) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 },
      );
    }

    // 3. Create reference
    const reference = `WD_${Date.now()}_${userId}`;

    const banksRes = await fetch("https://api.flutterwave.com/v3/banks/NG", {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      },
    });

    const banksData = await banksRes.json();

    if (!banksRes.ok || banksData.status !== "success") {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Unable to fetch bank list" },
        { status: 400 },
      );
    }
    const bankName =
      banksData.data.find((b) => b.code === bankCode)?.name || "Unknown Bank";

    // FIX (D.7): don't trust the client-submitted accountName. Re-resolve
    // it from Flutterwave right here so what we store in user_banks is
    // accurate. (This has no bearing on where the money actually goes —
    // the /v3/transfers call below only ever uses account_bank/
    // account_number — it's purely about record accuracy.)
    const resolveRes = await fetch(
      "https://api.flutterwave.com/v3/accounts/resolve",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_number: accountNumber,
          account_bank: bankCode,
        }),
      },
    );
    const resolveData = await resolveRes.json();

    if (!resolveRes.ok || resolveData.status !== "success") {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: resolveData.message || "Unable to verify bank account" },
        { status: 400 },
      );
    }

    const accountName = resolveData.data.account_name;

    await client.query(
      `
      INSERT INTO user_banks 
      (user_id, account_number, account_name, bank_code, bank_name, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (user_id, account_number, bank_code)
      DO UPDATE SET 
        account_name = EXCLUDED.account_name,
        bank_name = EXCLUDED.bank_name,
        created_at = NOW()
      `,
      [userId, accountNumber, accountName, bankCode, bankName],
    );

    // 4. Insert pending transaction FIRST
    // FIX (D.6): ON CONFLICT DO NOTHING against a partial unique index
    // scoped to withdrawal rows only (see
    // db/migrations/002_unique_withdrawal_reference.sql) as a
    // defense-in-depth backstop, on top of the per-user row lock that
    // already makes a real collision effectively impossible. This is
    // scoped to withdrawals specifically (not a table-wide constraint on
    // `reference`) because other transaction types in this table
    // deliberately reuse one `reference` across several rows (e.g. a
    // marketplace purchase's buyer-debit/seller-credit/fee rows all
    // share one reference) — the WHERE clause here must match the
    // migration's index predicate exactly for Postgres to use it as the
    // conflict arbiter.
    const insertRes = await client.query(
      `
      INSERT INTO users_transactions
      (user_id, type, amount, status, description, reference, affects_balance)
      VALUES ($1, 'debit', $2, 'pending', 'Withdrawal', $3, true)
      ON CONFLICT (reference) WHERE type = 'debit' AND description = 'Withdrawal'
      DO NOTHING
      RETURNING id
      `,
      [userId, amount, reference],
    );

    if (insertRes.rows.length === 0) {
      // Reference collision (should be practically impossible given the
      // row lock, but if it ever happens, fail closed rather than risk a
      // second Flutterwave call against a reused reference).
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Could not start withdrawal, please try again" },
        { status: 409 },
      );
    }

    await client.query("COMMIT");

    // 5. CALL FLUTTERWAVE (outside DB transaction) — via the Render proxy,
    // since Flutterwave's transfer endpoint requires a whitelisted IP and
    // Netlify's outbound IP isn't static.
    try {
      const {
        ok: flwOk,
        ambiguous,
        data: flwData,
      } = await requestFlutterwaveTransfer({
        account_bank: bankCode,
        account_number: accountNumber,
        // Flutterwave amount is in naira, not kobo.
        amount,
        currency: "NGN",
        narration: "Wallet withdrawal",
        reference,
      });

      // FIX (D.1, critical): an ambiguous outcome (we don't know if
      // Flutterwave actually received/queued the transfer) must NEVER be
      // treated as a clean failure — that would free the user's balance
      // to retry while the original transfer might already be in flight
      // or complete, risking a double payout. Reconcile first.
      if (ambiguous) {
        const status = await resolveAmbiguousTransfer(reference);

        if (status === "success" || status === "pending") {
          // Flutterwave confirms it does have this transfer (queued or
          // already successful) — leave the row as-is (pending) so the
          // transfer.completed webhook (or the next reconciliation pass)
          // can finalize it normally. DO NOT free the balance.
          return NextResponse.json({
            success: true,
            message: "Withdrawal initiated",
            reference,
          });
        }

        if (status === "failed") {
          // Flutterwave confirms no transfer exists / it failed — safe
          // to release the balance for a retry.
          await pool.query(
            `UPDATE users_transactions SET status = 'failed' WHERE reference = $1`,
            [reference],
          );
          return NextResponse.json(
            { error: "Transfer failed, please try again" },
            { status: 400 },
          );
        }

        // status === "unknown": couldn't get a definitive answer from
        // Flutterwave either. Mark the row 'unknown' — still counted
        // against the user's balance (see the CASE statements above and
        // in account/route.js) so it can't be double-spent — and alert
        // an admin so this gets a human/background reconciliation pass
        // instead of sitting silently.
        await pool.query(
          `UPDATE users_transactions SET status = 'unknown' WHERE reference = $1`,
          [reference],
        );
        sendAdminAlert(
          "Withdrawal status could not be confirmed with Flutterwave — needs manual reconciliation",
          { reference, userId, amount, accountNumber, bankCode },
        ).catch((err) => console.error("❌ Admin alert email failed:", err));

        return NextResponse.json({
          success: true,
          message:
            "Withdrawal is being processed. We'll confirm once it completes.",
          reference,
        });
      }

      if (!flwOk || flwData.status !== "success") {
        await pool.query(
          `UPDATE users_transactions SET status = 'failed' WHERE reference = $1`,
          [reference],
        );

        return NextResponse.json(
          { error: flwData.message || "Transfer failed" },
          { status: 400 },
        );
      }

      // FIX (D.5): a transfer can come back "queued" but flagged
      // requires_approval — meaning it won't move further until someone
      // manually approves it in the Flutterwave dashboard, and no
      // webhook will fire until that happens. Surface this instead of
      // letting it sit invisibly in 'pending' forever.
      if (Number(flwData?.data?.requires_approval) === 1) {
        sendAdminAlert(
          "Withdrawal requires manual approval in the Flutterwave dashboard",
          { reference, userId, amount, accountNumber, bankCode },
        ).catch((err) => console.error("❌ Admin alert email failed:", err));
      }

      return NextResponse.json({
        success: true,
        message: "Withdrawal initiated",
        reference,
      });
    } catch (transferErr) {
      // FIX (D.1): a thrown error this far out is itself an ambiguous
      // outcome (see requestFlutterwaveTransfer — it shouldn't normally
      // throw anymore, but fail safe rather than assume failure).
      console.error("Flutterwave transfer call failed:", transferErr);

      const status = await resolveAmbiguousTransfer(reference);

      if (status === "failed") {
        await pool.query(
          `UPDATE users_transactions SET status = 'failed' WHERE reference = $1`,
          [reference],
        );
        return NextResponse.json(
          { error: "Transfer failed, please try again" },
          { status: 500 },
        );
      }

      if (status === "unknown") {
        await pool.query(
          `UPDATE users_transactions SET status = 'unknown' WHERE reference = $1`,
          [reference],
        );
        sendAdminAlert(
          "Withdrawal status could not be confirmed with Flutterwave — needs manual reconciliation",
          { reference, userId, amount, accountNumber, bankCode },
        ).catch((err) => console.error("❌ Admin alert email failed:", err));
      }

      return NextResponse.json({
        success: true,
        message:
          "Withdrawal is being processed. We'll confirm once it completes.",
        reference,
      });
    }
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      // transaction may already be closed (e.g. committed earlier) — ignore
    }
    console.error("Withdraw error:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

// FIX (D.1): shared helper for both the "ambiguous proxy response" and
// "the whole call threw" cases. Asks Flutterwave directly (via the
// whitelisted-IP proxy) what it actually knows about this reference, and
// returns one of:
//   "success" — Flutterwave has a SUCCESSFUL transfer for this reference
//   "pending" — Flutterwave has it queued/processing (NEW/PENDING)
//   "failed"  — Flutterwave has no record of it, or it's FAILED there
//   "unknown" — couldn't get a definitive answer at all; needs a human
async function resolveAmbiguousTransfer(reference) {
  const result = await checkFlutterwaveTransferStatus({ reference });

  if (result.ambiguous) return "unknown";

  if (!result.found) return "failed";

  const flwStatus = String(result.data?.status || "").toUpperCase();

  if (flwStatus === "SUCCESSFUL") return "success";
  if (flwStatus === "FAILED") return "failed";
  // NEW / PENDING / anything else Flutterwave hasn't resolved yet.
  return "pending";
}