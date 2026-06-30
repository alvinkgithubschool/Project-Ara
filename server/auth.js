import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Database: SQLite for local dev, PostgreSQL for production ──
// On Render (and most PaaS) the filesystem is ephemeral, so a SQLite file
// would be wiped on every deploy/restart. Use Postgres when DATABASE_URL is
// present; otherwise fall back to a local SQLite file for development.
const isProduction = process.env.NODE_ENV === "production";
let database;

if (isProduction && process.env.DATABASE_URL) {
  const { Pool } = await import("pg");
  database = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  console.log("Auth DB: PostgreSQL (production)");
} else {
  const dataDir = process.env.ARA_DATA_DIR || path.resolve(__dirname, "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, "ara_auth.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  database = db;
  console.log(`Auth DB: SQLite (${dbPath})`);
}

// Origins permitted to use the auth API. Extendable via CORS_ORIGIN
// (comma-separated) so the deployed server can trust the Tauri app origin.
const extraOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const trustedOrigins = [
  "http://localhost:1420",
  "http://localhost:8787",
  "tauri://localhost",
  ...extraOrigins,
];

export const auth = betterAuth({
  database,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  trustedOrigins,
});
