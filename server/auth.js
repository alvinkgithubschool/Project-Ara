import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Determine the database path from the ARA_DATA_DIR env var,
// or default to the server directory.
const dataDir = process.env.ARA_DATA_DIR || path.resolve(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "ara_auth.db");
const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma("journal_mode = WAL");

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:8787",
  database: db,

  // Email & password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Desktop app — trust local setup
  },

  // Social providers — configured via environment variables
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

  // Plugins
  plugins: [
    twoFactor(),
    passkey({
      rpId: "localhost",
      rpName: "Project Ara",
      origin: "http://localhost:1420", // Tauri dev URL
    }),
  ],

  // Trust the localhost origin
  trustedOrigins: [
    "http://localhost:1420",
    "http://localhost:8787",
    "tauri://localhost",
  ],

  // Session configuration
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Refresh session every 24 hours
  },
});
