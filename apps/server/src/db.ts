// apps/server/src/db.ts — the one connection pool to Postgres, opened once
import { drizzle } from "drizzle-orm/node-postgres";

// DATABASE_URL in apps/server/.env: compose's Postgres, or Neon's connection string
if (!Bun.env.DATABASE_URL) {
  throw new Error("Set DATABASE_URL in apps/server/.env: copy .env.example");
}
const url = new URL(Bun.env.DATABASE_URL);
// bun test sets NODE_ENV=test: the tests get the database next door, never the app's
if (Bun.env.NODE_ENV === "test") {
  url.pathname = "/office_test";
}

// a pool of connections (node-postgres); createdAt in code, created_at in SQL
export const db = drizzle({
  casing: "snake_case",
  connection: url.toString(),
});
