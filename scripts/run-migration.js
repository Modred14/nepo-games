// scripts/run-migration.js
//
// Tiny standalone migration runner — this repo has no migration framework
// (no node-pg-migrate/knex/prisma), and db/migrations/*.sql files aren't
// applied automatically by anything. This script just reads a .sql file
// and executes it against DATABASE_URL using the same `pg` package and
// SSL settings as src/lib/db.js, so `npm run db:migrate` has something to
// call.
//
// Usage:
//   npm run db:migrate db/migrations/002_unique_withdrawal_reference.sql
//
// Reads DATABASE_URL from the environment. If you keep it in a .env file
// locally, run it as:
//   npx dotenv -e .env -- npm run db:migrate db/migrations/002_unique_withdrawal_reference.sql
// or export it in your shell first.

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function main() {
  const fileArg = process.argv[2];

  if (!fileArg) {
    console.error("Usage: node scripts/run-migration.js <path-to-migration.sql>");
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), fileArg);

  if (!fs.existsSync(filePath)) {
    console.error(`Migration file not found: ${filePath}`);
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set in the environment.");
    process.exit(1);
  }

  const sql = fs.readFileSync(filePath, "utf8");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log(`Connecting to database...`);
  await client.connect();

  try {
    console.log(`Running ${fileArg} ...`);
    await client.query(sql);
    console.log("✅ Migration applied successfully.");
  } catch (err) {
    if (err.code === "42P07" || /already exists/i.test(err.message)) {
      // duplicate_object — the constraint is already there, nothing to do.
      console.warn(`⚠️  Migration appears to already be applied: ${err.message}`);
    } else if (err.code === "23505") {
      // unique_violation — existing duplicate `reference` values are
      // blocking the constraint from being added. Must be fixed manually
      // before this migration can succeed.
      console.error(
        "❌ Could not add the unique constraint — duplicate `reference` values already exist in users_transactions. Find and resolve them first:\n" +
          "   SELECT reference, COUNT(*) FROM users_transactions GROUP BY reference HAVING COUNT(*) > 1;",
      );
      process.exit(1);
    } else {
      console.error("❌ Migration failed:", err.message);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

main();