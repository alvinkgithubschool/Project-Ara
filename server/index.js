import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth.js";
import { serve } from "@hono/node-server";

const app = new Hono();

// CORS — allow the Tauri frontend
app.use(
  "*",
  cors({
    origin: ["http://localhost:1420", "tauri://localhost", "http://localhost:8787"],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Better Auth handler — mounts at /api/auth/*
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

const port = parseInt(process.env.AUTH_PORT || "8787");
console.log(`[Ara Auth] Starting server on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
