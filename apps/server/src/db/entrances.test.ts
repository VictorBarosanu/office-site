// apps/server/src/db/entrances.test.ts — the repository against a :memory: database
import { beforeAll, expect, test } from "bun:test";
import { Entrance } from "field-app-contract/contract";
import entranceRows from "field-app-contract/fixtures/entrances.json";
import { migrate } from "../../scripts/migrate";
import { seed } from "../../scripts/seed";
import { db } from "../db";
import {
  createEntrance,
  getEntrance,
  listEntrances,
  searchEntrances,
} from "./entrances";

// the same migrations and the same seed as the real database, on an empty one
beforeAll(() => {
  // the seed empties every table: never run it against data/office.sqlite
  if (db.$client.filename !== ":memory:") {
    throw new Error(
      `Refusing to test on ${db.$client.filename}: run "bun test", which sets NODE_ENV=test`
    );
  }
  migrate();
  seed();
});

test("the seed brings the contract's 20 entrances back exactly as the fixture has them", () => {
  const listed = listEntrances();
  expect(listed).toHaveLength(20);
  // every column survives the trip: UUIDs, 0/1 → booleans, nulls, timestamps
  expect(listed).toEqual(expect.arrayContaining(entranceRows));
});

test("the search treats a quote as text, not as SQL", () => {
  expect(searchEntrances("Lipscani")).toHaveLength(3);
  expect(searchEntrances("x' OR 1=1 --")).toEqual([]);
});

test("one entrance by its id, and nothing for an id that is not there", () => {
  const id = "2511ddfb-2828-46f5-b23c-39501d862310"; // a fixture
  expect(getEntrance(id)).toMatchObject({
    entranceName: "Sc. A",
    id,
    number: "41",
    street: "Strada Lipscani",
  });
  expect(getEntrance(crypto.randomUUID())).toBeUndefined();
});

test("a new entrance is a valid contract Entrance, not surveyed yet", () => {
  const created = createEntrance({
    buildingId: "4d76b72c-33e5-484c-8c44-3165dc270dca", // Lipscani 41, a fixture
    entranceName: "Sc. D",
    lat: 44.431_61,
    lng: 26.1015,
    number: "41",
    street: "Strada Lipscani",
  });
  // the schema made the id and the timestamps; the contract accepts the row
  expect(Entrance.parse(created)).toEqual(created);
  expect(created.surveyStatus).toBe("not_started");
  expect(listEntrances()).toHaveLength(21);
});
