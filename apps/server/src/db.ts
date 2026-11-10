// apps/server/src/db.ts
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";

const defaultFile = join(import.meta.dir, "../data/office.sqlite");
const file =
  process.env.NODE_ENV === "test"
    ? ":memory:"
    : (process.env.DB_FILE ?? defaultFile);

if (file !== ":memory:") {
  mkdirSync(dirname(file), { recursive: true });
}

const sqlite = new Database(file, { create: true, strict: true });
sqlite.run("PRAGMA journal_mode = WAL;");
sqlite.run("PRAGMA foreign_keys = ON;");

export const db = drizzle({ casing: "snake_case", client: sqlite });
