// apps/server/src/db/buildings.ts — the queries for buildings; routes call these functions
import type { NewBuilding } from "@office/shared";
import { asc, eq } from "drizzle-orm";
import type { Building } from "field-app-contract/contract";
import { db } from "../db";
import { buildings } from "./schema";

export function listBuildings(): Building[] {
  return db.select().from(buildings).orderBy(asc(buildings.label)).all();
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
