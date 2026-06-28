import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
    max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 15000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export async function query(text, params, retries = 1) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    if (retries > 0 && err.code === "ECONNRESET") {
      console.warn("ECONNRESET — retrying query...");
      return query(text, params, retries - 1);
    }
    throw err;
  }
}
export default pool;