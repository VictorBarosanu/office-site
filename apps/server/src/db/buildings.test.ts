// apps/server/src/db/buildings.test.ts — the buildings, from an empty table: whatever other files wrote
import { beforeAll, expect, test } from "bun:test";
import {
  createBuilding,
  listBuildings,
  searchBuildings,
  toMatchQuery,
} from "./buildings";
import { buildings } from "./schema";
import { truncate } from "./truncate";

const ALL = { limit: 100, offset: 0 };

beforeAll(async () => {
  // a row another file could have left: written here, so the test holds in any file order
  await createBuilding({ comment: "Left by another file", label: "Leftover" });
  // the line that makes the file independent: without it, the test sees that row
  await truncate(buildings);
});

test("this file starts from an empty table: no other file's buildings are here", async () => {
  expect((await listBuildings(ALL)).total).toBe(0);
  await createBuilding({ comment: "Only this file wrote me", label: "Leak 1" });
  expect((await listBuildings(ALL)).total).toBe(1);
  expect((await searchBuildings(toMatchQuery("leak"), ALL)).total).toBe(1);
});
