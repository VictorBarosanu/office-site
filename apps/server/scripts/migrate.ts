// apps/server/scripts/migrate.ts — apply every migrations/NNN-*.sql once, in order
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "../src/db";

const folder = join(import.meta.dir, "../migrations");

export function migrate() {
  // the runner's own table: one row per file already applied
  db.run(`CREATE TABLE IF NOT EXISTS migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  ) STRICT`);
  const applied = db
    .query<{ name: string }, []>("SELECT name FROM migrations")
    .all();
  const done = new Set(applied.map((row) => row.name));

  const files = readdirSync(folder)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of files.filter((name) => !done.has(name))) {
    const sql = readFileSync(join(folder, file), "utf8");
    // the file and its record together, or neither
    db.transaction(() => {
      db.run(sql);
      db.query("INSERT INTO migrations (name) VALUES (?)").run(file);
    })();
    console.log(`applied ${file}`);
  }
  console.log(`${files.length} migrations, ${files.length - done.size} new`);
}

// `bun scripts/migrate.ts` runs it; a test can import migrate() instead
if (import.meta.main) {
  migrate();
}
