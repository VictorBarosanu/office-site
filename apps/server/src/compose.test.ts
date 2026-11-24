// apps/server/src/compose.test.ts — what docker compose up brings: Postgres and Mailpit answer
import { expect, test } from "bun:test";
import { SQL } from "bun";

test("Postgres answers at DATABASE_URL, and office_test is there for the tests", async () => {
  // Bun's own Postgres client: nothing to install for one query
  const pg = new SQL(Bun.env.DATABASE_URL ?? "");
  const [server] = await pg`SELECT version() AS version`;
  expect(server.version).toStartWith("PostgreSQL ");
  const databases =
    await pg`SELECT datname FROM pg_database WHERE datname = 'office_test'`;
  expect(databases).toHaveLength(1);
  await pg.close();
});

test("Mailpit answers: its inbox is at :8025", async () => {
  const res = await fetch("http://localhost:8025/livez");
  expect(res.status).toBe(200);
});
