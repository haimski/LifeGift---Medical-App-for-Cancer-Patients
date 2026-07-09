import "server-only";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

// Node.js serverless functions (unlike edge runtimes) have no native
// WebSocket global, so the Neon driver needs one injected — see
// @prisma/adapter-neon's README.
neonConfig.webSocketConstructor = ws;

let client: PrismaClient | null = null;

/**
 * Server-only singleton, mirroring lib/llm/client.ts's pattern. Uses Neon's
 * serverless driver adapter (HTTP/WebSocket-based) rather than a raw `pg`
 * TCP connection — each Vercel serverless invocation is a short-lived
 * process, and concurrent invocations exhaust a normal Postgres connection
 * pool quickly. See the plan's "Prisma + serverless Postgres connections" risk.
 */
export function getPrismaClient(): PrismaClient {
  if (!client) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    const adapter = new PrismaNeon({ connectionString });
    client = new PrismaClient({ adapter });
  }
  return client;
}
