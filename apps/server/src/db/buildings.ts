// apps/server/src/db/buildings.ts — the SQL for buildings; routes call these functions
import type { Building, NewBuilding } from "@office/shared";
import { db } from "../db";

export function listBuildings(): Building[] {
  return db
    .query<Building, []>("SELECT id, name, city FROM buildings ORDER BY name")
    .all();
}

export function createBuilding(building: NewBuilding): Building {
  // RETURNING * hands back the row as stored, id included
  const row = db
    .query<Building, [string, string]>(
      "INSERT INTO buildings (name, city) VALUES (?, ?) RETURNING *"
    )
    .get(building.name, building.city);
  if (!row) {
    throw new Error("INSERT … RETURNING gave no row");
  }
  return row;
}
