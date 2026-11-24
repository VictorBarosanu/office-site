// apps/server/src/db/buildings.ts — the queries for buildings; routes call these functions
import type { NewBuilding, Page, PageQuery } from "@office/shared";
import { asc, count, desc, eq, getTableColumns, sql } from "drizzle-orm";
import type { Building } from "field-app-contract/contract";
import { db } from "../db";
import { iso } from "./iso";
import { buildings } from "./schema";

// the contract's columns: never the search column, which is Postgres's, not the API's
const { search: _search, ...building } = getTableColumns(buildings);

// one page; the id breaks ties, so two pages never share a row
export async function listBuildings({
  limit,
  offset,
}: PageQuery): Promise<Page<Building>> {
  const rows = await db
    .select(building)
    .from(buildings)
    .orderBy(asc(buildings.label), asc(buildings.id))
    .limit(limit)
    .offset(offset);
  const [counted] = await db.select({ n: count() }).from(buildings);
  return { items: rows.map(iso), limit, offset, total: counted?.n ?? 0 };
}

export async function createBuilding(
  newBuilding: NewBuilding
): Promise<Building> {
  // id, createdAt and updatedAt come from the schema's defaults
  const [created] = await db
    .insert(buildings)
    .values(newBuilding)
    .returning(building);
  if (!created) {
    throw new Error("INSERT … RETURNING gave back no row");
  }
  return iso(created);
}

// the number of rows deleted: 0 when there was no such building
export async function deleteBuilding(id: string): Promise<number> {
  const deleted = await db
    .delete(buildings)
    .where(eq(buildings.id, id))
    .returning({ id: buildings.id });
  return deleted.length;
}

// "lips fran" → "lips:* & fran:*": every word, as the start of a word; only letters and
// digits survive, so to_tsquery's own syntax (&, |, !, quotes, brackets) is never run
export function toMatchQuery(q: string): string {
  const words = q.match(/[\p{L}\p{N}]+/gu) ?? [];
  return words.map((word) => `${word}:*`).join(" & ");
}

// @@ asks the GIN index, ts_rank orders the best match first, the id settles a tie;
// 'office' takes the accents off the query's words too
export async function searchBuildings(
  match: string,
  { limit, offset }: PageQuery
): Promise<Page<Building>> {
  const query = sql`to_tsquery('office', ${match})`;
  const matches = sql`${buildings.search} @@ ${query}`;
  const rows = await db
    .select(building)
    .from(buildings)
    .where(matches)
    .orderBy(
      desc(sql`ts_rank(${buildings.search}, ${query})`),
      asc(buildings.id)
    )
    .limit(limit)
    .offset(offset);
  const [counted] = await db
    .select({ n: count() })
    .from(buildings)
    .where(matches);
  return { items: rows.map(iso), limit, offset, total: counted?.n ?? 0 };
}
