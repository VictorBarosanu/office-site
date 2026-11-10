// apps/server/scripts/seed.ts — the contract's fixtures as development rows; never in production
import { Building, Entrance } from "field-app-contract/contract";
import buildingRows from "field-app-contract/fixtures/buildings.json";
import entranceRows from "field-app-contract/fixtures/entrances.json";
import { db } from "../src/db";
import { buildings, entrances, surveys } from "../src/db/schema";

export function seed() {
  // the contract checks its own fixtures before they go in
  const buildingList = Building.array().parse(buildingRows);
  const entranceList = Entrance.array().parse(entranceRows);
  db.transaction((tx) => {
    // children first: a building cannot go while its entrances point at it
    tx.delete(surveys).run();
    tx.delete(entrances).run();
    tx.delete(buildings).run();
    tx.insert(buildings).values(buildingList).run();
    tx.insert(entrances).values(entranceList).run();
  });
}

if (import.meta.main) {
  seed();
  console.log({
    buildings: await db.$count(buildings),
    entrances: await db.$count(entrances),
    surveys: await db.$count(surveys),
  });
}
