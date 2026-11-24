// apps/server/scripts/migrate.ts — apply every drizzle/NNNN_*.sql once, in order
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { migrate as applyMigrations } from "drizzle-orm/node-postgres/migrator";
import { db } from "../src/db";

export async function migrate() {
  // Drizzle records each file it applied in drizzle.__drizzle_migrations
  await applyMigrations(db, {
    migrationsFolder: join(import.meta.dir, "../drizzle"),
  });
}

if (import.meta.main) {
  await migrate();
  const { rows } = await db.execute<{ count: number }>(
    sql`SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations`
  );
  console.log(`${rows[0]?.count} migration(s) in the database`);
  // the pool keeps the process alive until it is closed
  await db.$client.end();
}
