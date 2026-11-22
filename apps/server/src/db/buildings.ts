// apps/server/src/db/buildings.ts — the queries for buildings; routes call these functions
import type { NewBuilding, Page, PageQuery } from "@office/shared";
import { asc, count, eq } from "drizzle-orm";
import type { Building } from "field-app-contract/contract";
import { db } from "../db";
import { buildings } from "./schema";

// one page; the id breaks ties, so two pages never share a row
export function listBuildings({ limit, offset }: PageQuery): Page<Building> {
  const items = db
    .select()
    .from(buildings)
    .orderBy(asc(buildings.label), asc(buildings.id))
    .limit(limit)
    .offset(offset)
    .all();
  const total = db.select({ n: count() }).from(buildings).get()?.n ?? 0;
  return { items, limit, offset, total };
}

export function createBuilding(building: NewBuilding): Building {
  // id, createdAt and updatedAt come from the schema's $defaultFn
  return db.insert(buildings).values(building).returning().get();
}

// the number of rows deleted: 0 when there was no such building
export function deleteBuilding(id: string): number {
  return db
    .delete(buildings)
    .where(eq(buildings.id, id))
    .returning({ id: buildings.id })
    .all().length;
}
