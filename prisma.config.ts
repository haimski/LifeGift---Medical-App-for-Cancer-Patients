import "dotenv/config";
import { defineConfig } from "prisma/config";

// Defining a prisma.config.ts opts out of Prisma's automatic .env loading,
// so the CLI (migrate/db push/studio) needs `dotenv/config` to pick up
// DATABASE_URL from .env.local the same way Next.js's own dev/build already
// does at runtime — see .env.example.
//
// Schema lives under lib/db/ instead of the default prisma/ directory — see
// lib/db/schema.prisma's own doc comment for why.
export default defineConfig({
  schema: "lib/db/schema.prisma",
});
