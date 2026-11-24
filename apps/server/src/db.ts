// apps/server/src/db.ts — the one connection pool to Postgres, opened once
import { drizzle } from "drizzle-orm/node-postgres";

// DATABASE_URL: .env for the app (compose's Postgres, or Neon); .env.test for bun test
const url = Bun.env.DATABASE_URL;
if (!url) {
  throw new Error("Set DATABASE_URL in apps/server/.env: copy .env.example");
}
// the tests empty tables: never let them near a database that is not a _test one
const name = new URL(url).pathname.slice(1);
if (Bun.env.NODE_ENV === "test" && !name.endsWith("_test")) {
  throw new Error(
    `Refusing to test on ${name}: bun test reads DATABASE_URL from .env.test`
  );
}

// a pool of connections (node-postgres); createdAt in code, created_at in SQL
export const db = drizzle({ casing: "snake_case", connection: url });
