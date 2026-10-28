// apps/server/src/db.ts — the one connection to the database file, opened once
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

// apps/server/data/, wherever the command was started from
const folder = join(import.meta.dir, "../data");
mkdirSync(folder, { recursive: true });

export const db = new Database(join(folder, "office.sqlite"), {
  create: true,
  strict: true,
});
// readers do not wait for the writer; see the course's WAL slide
db.run("PRAGMA journal_mode = WAL;");
// SQLite ignores REFERENCES unless every connection turns this on
db.run("PRAGMA foreign_keys = ON;");
