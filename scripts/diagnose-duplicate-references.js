// scripts/diagnose-duplicate-references.js
//
// Run before applying db/migrations/002_unique_withdrawal_reference.sql if
// that migration fails with a unique_violation (23505). Shows the full
// detail of every duplicated `reference` value — not just the count — so
// you can tell whether this is a genuine duplicate-payout situation (see
// audit item D.1) or something more benign (e.g. NULL references from a
// transaction type that never sets one, old test/seed data, etc.).
//
// Usage:
//   npm run db:diagnose-duplicates

const { Client } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set in the environment.");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    // Check withdrawal rows specifically FIRST — this is the only case
    // that actually matters for db/migrations/002_unique_withdrawal_reference.sql
    // (a partial unique index scoped to type='debit' AND
    // description='Withdrawal'). Other transaction types in this table
    // deliberately reuse one `reference` across multiple rows (e.g. a
    // marketplace purchase's buyer-debit/seller-credit/fee rows), which
    // is expected and NOT a problem — see the full scan further below,
    // which will still show those, clearly separated.
    const withdrawalDupes = await client.query(`
      SELECT reference, COUNT(*) AS occurrences
      FROM users_transactions
      WHERE type = 'debit' AND description = 'Withdrawal'
      GROUP BY reference
      HAVING COUNT(*) > 1
      ORDER BY occurrences DESC
    `);

    if (withdrawalDupes.rows.length === 0) {
      console.log(
        "✅ No duplicate reference values among withdrawal rows (type='debit' AND description='Withdrawal').\n" +
          "   Safe to run: npm run db:migrate -- db/migrations/002_unique_withdrawal_reference.sql\n",
      );
    } else {
      console.log(
        `🚨 Found ${withdrawalDupes.rows.length} duplicated reference value(s) AMONG WITHDRAWAL ROWS SPECIFICALLY —\n` +
          "   this is the scenario audit item D.1 warned about (a possible duplicate payout).\n" +
          "   Do NOT run the migration until these are investigated:\n",
      );
      for (const row of withdrawalDupes.rows) {
        const detail = await client.query(
          `SELECT id, user_id, type, amount, status, description, created_at
           FROM users_transactions
           WHERE reference = $1 AND type = 'debit' AND description = 'Withdrawal'
           ORDER BY created_at`,
          [row.reference],
        );
        console.log(`── reference: ${row.reference}  (${row.occurrences} rows) ──`);
        for (const r of detail.rows) {
          console.log(
            `  id=${r.id} user_id=${r.user_id} amount=${r.amount} status=${r.status} at=${r.created_at.toISOString()}`,
          );
        }
        console.log("");
      }
    }

    console.log("── Full table scan (all transaction types, for context) ──\n");

    const dupes = await client.query(`
      SELECT reference, COUNT(*) AS occurrences
      FROM users_transactions
      GROUP BY reference
      HAVING COUNT(*) > 1
      ORDER BY occurrences DESC
    `);

    if (dupes.rows.length === 0) {
      console.log("✅ No duplicate reference values found. Safe to run the migration.");
      return;
    }

    console.log(`Found ${dupes.rows.length} distinct reference value(s) with duplicates:\n`);

    for (const row of dupes.rows) {
      const label = row.reference === null ? "NULL" : row.reference;
      console.log(`── reference: ${label}  (${row.occurrences} rows) ──`);

      const detail = await client.query(
        row.reference === null
          ? `SELECT id, user_id, type, amount, status, description, created_at
             FROM users_transactions WHERE reference IS NULL
             ORDER BY created_at`
          : `SELECT id, user_id, type, amount, status, description, created_at
             FROM users_transactions WHERE reference = $1
             ORDER BY created_at`,
        row.reference === null ? [] : [row.reference],
      );

      // If reference is NULL, this one query already returns every
      // NULL-reference row in the table, not just a "duplicate group" —
      // print a subset and move on so this doesn't flood the terminal.
      const rowsToShow = row.reference === null ? detail.rows.slice(0, 20) : detail.rows;

      for (const r of rowsToShow) {
        console.log(
          `  id=${r.id} user_id=${r.user_id} type=${r.type} amount=${r.amount} status=${r.status} desc="${r.description}" at=${r.created_at.toISOString()}`,
        );
      }
      if (row.reference === null && detail.rows.length > 20) {
        console.log(`  ... and ${detail.rows.length - 20} more NULL-reference rows`);
      }
      console.log("");
    }

    console.log(
      "ℹ️  The groups above are from the FULL table scan and include every transaction\n" +
        "type, not just withdrawals. It's expected/normal for non-withdrawal rows (e.g.\n" +
        "'Game account purchase' / 'Game account sale' / 'Listing fee' / 'Platform fee')\n" +
        "to share one reference across several rows — that's a deliberate design where\n" +
        "one reference ties together all the ledger entries for a single purchase event.\n" +
        "The only groups that matter for the withdrawal migration are the ones flagged\n" +
        "under 'WITHDRAWAL ROWS SPECIFICALLY' above, if any.",
    );
  } finally {
    await client.end();
  }
}

main();