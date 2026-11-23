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

// "lips fran" → "lips"* "fran"*: every word, as the start of a word; only letters and
// digits survive, so FTS5's own syntax (OR, NEAR, quotes, brackets) is never run
export function toMatchQuery(q: string): string {
  const words = q.match(/[\p{L}\p{N}]+/gu) ?? [];
  return words.map((word) => `"${word}"*`).join(" ");
}

// where the ORM stops: SQL by hand, sent to bun:sqlite, which prepares it once and
// reuses it; MATCH asks the index, bm25() ranks the best match first, the id settles a tie
export function searchBuildings(
  match: string,
  { limit, offset }: PageQuery
): Page<Building> {
  const items = db.$client
    .query<Building, { limit: number; match: string; offset: number }>(
      `SELECT b.id, b.created_at AS createdAt, b.updated_at AS updatedAt, b.label, b.comment
       FROM buildings_fts JOIN buildings b ON b.rowid = buildings_fts.rowid
       WHERE buildings_fts MATCH $match
       ORDER BY bm25(buildings_fts), b.id
       LIMIT $limit OFFSET $offset`
    )
    .all({ limit, match, offset });
  const total =
    db.$client
      .query<{ n: number }, { match: string }>(
        "SELECT count(*) AS n FROM buildings_fts WHERE buildings_fts MATCH $match"
      )
      .get({ match })?.n ?? 0;
  return { items, limit, offset, total };
}
