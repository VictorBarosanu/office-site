// apps/server/scripts/migrate.ts
import { join } from "node:path";
import { migrate as drizzleMigrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "../src/db";

export function migrate() {
  drizzleMigrate(db, {
    migrationsFolder: join(import.meta.dir, "../drizzle"),
  });
}

if (import.meta.main) {
  migrate();
}
