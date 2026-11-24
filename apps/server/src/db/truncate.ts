// apps/server/src/db/truncate.ts — empty tables in one statement: the seed and every test file start here
import { sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "../db";

// CASCADE: the rows that point at them go too (truncate buildings, and entrances follow)
export async function truncate(...tables: PgTable[]) {
  await db.execute(sql`TRUNCATE ${sql.join(tables, sql`, `)} CASCADE`);
}
