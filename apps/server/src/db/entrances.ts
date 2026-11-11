// apps/server/src/db/entrances.ts — the queries for entrances; routes call these functions
import type { NewEntrance } from "@office/shared";
import { asc, eq, like } from "drizzle-orm";
import type { Entrance } from "field-app-contract/contract";
import { db } from "../db";
import { entrances } from "./schema";

// a street, then its numbers, then the entrances of each number
const BY_ADDRESS = [
  asc(entrances.street),
  asc(entrances.number),
  asc(entrances.entranceName),
];

// the row is already the contract's Entrance: camelCase, booleans, no mapping
export function listEntrances(): Entrance[] {
  return db
    .select()
    .from(entrances)
    .orderBy(...BY_ADDRESS)
    .all();
}

// one entrance by its id, or undefined when there is none
export function getEntrance(id: string): Entrance | undefined {
  return db.select().from(entrances).where(eq(entrances.id, id)).get();
}

export function createEntrance(entrance: NewEntrance): Entrance {
  // the surveyed fields start empty: their defaults are in the schema
  return db.insert(entrances).values(entrance).returning().get();
}

export function searchEntrances(q: string): Entrance[] {
  // Drizzle sends q as a bound parameter, as lab 4 did by hand
  return db
    .select()
    .from(entrances)
    .where(like(entrances.street, `%${q}%`))
    .orderBy(...BY_ADDRESS)
    .all();
}

// the number of rows deleted: 0 when there was no such entrance
export function deleteEntrance(id: string): number {
  return db
    .delete(entrances)
    .where(eq(entrances.id, id))
    .returning({ id: entrances.id })
    .all().length;
}
