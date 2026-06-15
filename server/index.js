import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth.js";
import { serve } from "@hono/node-server";

// Await context and run migrations
const ctx = await auth.$context;
if (ctx.runMigrations) {
  await ctx.runMigrations();
  console.log("Migrations complete");
}

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["http://localhost:1420", "http://localhost:8787"],
    credentials: true,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Origin"],
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
app.get("/health", (c) => c.json({ status: "ok" }));

const port = parseInt(process.env.AUTH_PORT || "8787");
serve({ fetch: app.fetch, port });
console.log(`Auth server on http://localhost:${port}`);
