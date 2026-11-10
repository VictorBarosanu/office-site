// apps/server/src/db/entrances.test.ts — the repository test on an in-memory database
import { beforeAll, expect, test } from "bun:test";
import { NewBuilding, NewEntrance } from "@office/shared";
import { migrate } from "../../scripts/migrate";
import { createBuilding } from "./buildings";
import { createEntrance, listEntrances, searchEntrances } from "./entrances";

beforeAll(() => {
  migrate();
});

test("an entrance goes in and comes back, mapped to the contract type", () => {
  const building = createBuilding(NewBuilding.parse({ label: "Bloc C1" }));
  const created = createEntrance(
    NewEntrance.parse({
      buildingId: building.id,
      entranceName: "Sc. A",
      lat: 47.1585,
      lng: 27.6014,
      number: "12",
      street: "Str. Lapusneanu",
    })
  );

  expect(created.buildingId).toBe(building.id);
  expect(created.surveyStatus).toBe("not_started");
  expect(created.coordsConfirmed).toBe(false);
  expect(listEntrances()).toEqual([created]);
});

test("the search treats a quote as text, not as SQL", () => {
  expect(searchEntrances("' OR '1'='1")).toEqual([]);
});
