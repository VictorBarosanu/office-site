// apps/server/src/db/entrances.test.ts — the repository against office_test, the tests' database
import { beforeAll, expect, test } from "bun:test";
import { Entrance } from "field-app-contract/contract";
import entranceRows from "field-app-contract/fixtures/entrances.json";
import { migrate } from "../../scripts/migrate";
import { seed } from "../../scripts/seed";
import { createEntrance, getEntrance, listEntrances } from "./entrances";

const ALL = { limit: 100, offset: 0 };

// the same migrations and the same seed as the real database, on the tests' own
beforeAll(async () => {
  await migrate();
  await seed("test-only-password");
});

// the fixture's "2026-10-12T08:00:00Z" comes back as "2026-10-12T08:00:00.000Z": the same instant
const sameInstant = (text: string | null) =>
  text === null ? null : new Date(text).toISOString();

test("the seed brings the contract's 20 entrances back exactly as the fixture has them", async () => {
  const listed = (await listEntrances(ALL)).items;
  expect(listed).toHaveLength(20);
  // every column survives the trip: UUIDs, booleans, nulls, timestamps
  const fixtures = entranceRows.map((row) => ({
    ...row,
    createdAt: sameInstant(row.createdAt),
    surveyedAt: sameInstant(row.surveyedAt),
    updatedAt: sameInstant(row.updatedAt),
  }));
  expect(listed).toEqual(expect.arrayContaining(fixtures));
});

test("a timestamp goes in as a Date and comes back as the contract's ISO text", async () => {
  const id = "2511ddfb-2828-46f5-b23c-39501d862310"; // a fixture, created 2026-10-12T08:00:00Z
  const entrance = await getEntrance(id);
  expect(entrance?.createdAt).toBe("2026-10-12T08:00:00.000Z");
  expect(Entrance.parse(entrance)).toEqual(entrance as Entrance);
});

test("the search treats a quote as text, not as SQL", async () => {
  expect((await listEntrances(ALL, "Lipscani")).items).toHaveLength(3);
  expect((await listEntrances(ALL, "x' OR 1=1 --")).items).toEqual([]);
});

test("one entrance by its id, and nothing for an id that is not there", async () => {
  const id = "2511ddfb-2828-46f5-b23c-39501d862310"; // a fixture
  expect(await getEntrance(id)).toMatchObject({
    entranceName: "Sc. A",
    id,
    number: "41",
    street: "Strada Lipscani",
  });
  expect(await getEntrance(crypto.randomUUID())).toBeUndefined();
});

test("a new entrance is a valid contract Entrance, not surveyed yet", async () => {
  const created = await createEntrance({
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
  expect((await listEntrances(ALL)).total).toBe(21);
});
