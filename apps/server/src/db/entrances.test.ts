// apps/server/src/db/entrances.test.ts — the repository against a :memory: database
import { beforeAll, expect, test } from "bun:test";
import { NewBuilding } from "@office/shared";
import { migrate } from "../../scripts/migrate";
import { createBuilding } from "./buildings";
import { createEntrance, listEntrances, searchEntrances } from "./entrances";

// the same migrations as the real database, on an empty one
beforeAll(() => {
  migrate();
});

test("an entrance goes in and comes back, mapped to the shared type", () => {
  const building = createBuilding(
    NewBuilding.parse({ city: "Iași", name: "Bloc Copou 3" })
  );
  const created = createEntrance({
    address: "Bd. Carol I 3, scara A",
    buildingId: building.id,
    floors: 5,
    hasElevator: true,
  });

  expect(created).toEqual({
    address: "Bd. Carol I 3, scara A",
    buildingId: building.id,
    buildingName: "Bloc Copou 3",
    floors: 5,
    hasElevator: true, // stored as 1, read back as true
    id: created.id,
  });
  expect(listEntrances()).toEqual([created]);
});

test("the search treats a quote as text, not as SQL", () => {
  expect(searchEntrances("carol")).toHaveLength(1);
  expect(searchEntrances("x' OR 1=1 --")).toEqual([]);
});
