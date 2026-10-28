// apps/server/src/db/entrances.ts — the SQL for entrances; routes call these functions
import type { Entrance, NewEntrance } from "@office/shared";
import { db } from "../db";

// a row as SQLite gives it: snake_case, the boolean as 0 or 1
interface EntranceRow {
  address: string;
  building_id: number;
  building_name: string;
  floors: number;
  has_elevator: number;
  id: number;
}

const SELECT_ENTRANCES = `
  SELECT e.id, e.building_id, b.name AS building_name,
         e.address, e.floors, e.has_elevator
  FROM entrances e
  JOIN buildings b ON b.id = e.building_id`;

// the row → the shared type: camelCase, 0/1 → false/true
function toEntrance(row: EntranceRow): Entrance {
  return {
    address: row.address,
    buildingId: row.building_id,
    buildingName: row.building_name,
    floors: row.floors,
    hasElevator: row.has_elevator === 1,
    id: row.id,
  };
}

export function listEntrances(): Entrance[] {
  return db
    .query<EntranceRow, []>(`${SELECT_ENTRANCES} ORDER BY e.id`)
    .all()
    .map(toEntrance);
}

export function getEntrance(id: number): Entrance | null {
  const row = db
    .query<EntranceRow, [number]>(`${SELECT_ENTRANCES} WHERE e.id = ?`)
    .get(id);
  return row ? toEntrance(row) : null;
}

export function createEntrance(entrance: NewEntrance): Entrance {
  const row = db
    .query<{ id: number }, [number, string, number, number]>(
      `INSERT INTO entrances (building_id, address, floors, has_elevator)
       VALUES (?, ?, ?, ?) RETURNING *`
    )
    .get(
      entrance.buildingId,
      entrance.address,
      entrance.floors,
      entrance.hasElevator ? 1 : 0
    );
  // read it back through the JOIN, so the answer has the building's name
  const created = row ? getEntrance(row.id) : null;
  if (!created) {
    throw new Error("INSERT … RETURNING gave no row");
  }
  return created;
}
