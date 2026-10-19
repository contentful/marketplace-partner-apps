import pg from "pg";
const { Pool } = pg;

// Helper to check if we have a valid connection
export const hasPostgres =
  !!process.env.DATABASE_URL || !!process.env.POSTGRES_URL;

if (!hasPostgres) {
  console.warn(
    "⚠️ No DATABASE_URL or POSTGRES_URL found. Data will not persist.",
  );
}

// Create a singleton pool instance
// Use DATABASE_URL if available, otherwise POSTGRES_URL (Vercel default)
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const useLocalPostgres =
  !!connectionString &&
  (connectionString.includes("@127.0.0.1:") ||
    connectionString.includes("@localhost:") ||
    connectionString.includes("postgres://postgres:postgres@127.0.0.1:") ||
    connectionString.includes("postgres://postgres:postgres@localhost:"));

export const db = new Pool({
  connectionString,
  max: process.env.VERCEL ? 1 : 10, // Limit connections in serverless
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: useLocalPostgres
    ? false
    : {
        // Production: verify server certificates. If your provider uses a custom CA,
        // set NODE_EXTRA_CA_CERTS to the CA bundle path.
        rejectUnauthorized: true,
      },
});
