// apps/server/src/db/entrances.ts — the queries for entrances; routes call these functions
import type { NewEntrance, Page, PageQuery } from "@office/shared";
import { asc, count, eq, ilike } from "drizzle-orm";
import type { Entrance } from "field-app-contract/contract";
import { db } from "../db";
import { iso } from "./iso";
import { entrances } from "./schema";

// a street, then its numbers, then the entrances of each number
const BY_ADDRESS = [
  asc(entrances.street),
  asc(entrances.number),
  asc(entrances.entranceName),
  asc(entrances.id),
];

// the row is the contract's Entrance once its Dates are ISO text;
// q searches the street (Drizzle sends it as a bound parameter, as lab 4 did by hand);
// ilike: Postgres's like cares about case, SQLite's did not
export async function listEntrances(
  { limit, offset }: PageQuery,
  q?: string
): Promise<Page<Entrance>> {
  const where = q ? ilike(entrances.street, `%${q}%`) : undefined;
  const rows = await db
    .select()
    .from(entrances)
    .where(where)
    .orderBy(...BY_ADDRESS)
    .limit(limit)
    .offset(offset);
  const [counted] = await db
    .select({ n: count() })
    .from(entrances)
    .where(where);
  return { items: rows.map(iso), limit, offset, total: counted?.n ?? 0 };
}

// one entrance by its id, or undefined when there is none
export async function getEntrance(id: string): Promise<Entrance | undefined> {
  const [found] = await db.select().from(entrances).where(eq(entrances.id, id));
  return found && iso(found);
}

export async function createEntrance(entrance: NewEntrance): Promise<Entrance> {
  // the surveyed fields start empty: their defaults are in the schema
  const [created] = await db.insert(entrances).values(entrance).returning();
  if (!created) {
    throw new Error("INSERT … RETURNING gave back no row");
  }
  return iso(created);
}

// the number of rows deleted: 0 when there was no such entrance
export async function deleteEntrance(id: string): Promise<number> {
  const deleted = await db
    .delete(entrances)
    .where(eq(entrances.id, id))
    .returning({ id: entrances.id });
  return deleted.length;
}
