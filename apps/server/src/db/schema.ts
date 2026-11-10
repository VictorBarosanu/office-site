// apps/server/src/db/schema.ts — the tables in TypeScript; drizzle-kit writes the SQL
// biome-ignore-all assist/source/useSortedKeys: the order of the keys is the order of the columns

import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { SurveyStatus } from "field-app-contract/contract";

const now = () => new Date().toISOString();

// every contract entity has these three: a UUID and two ISO timestamps
const row = {
  id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdAt: text().notNull().$defaultFn(now),
  updatedAt: text().notNull().$defaultFn(now).$onUpdateFn(now),
};

// the contract's Building, field for field
export const buildings = sqliteTable("buildings", {
  ...row,
  label: text().notNull(),
  comment: text(),
});

// the contract's Entrance: the office's placement, then the surveyed fields
export const entrances = sqliteTable("entrances", {
  ...row,
  buildingId: text()
    .notNull()
    .references(() => buildings.id),
  lat: real().notNull(),
  lng: real().notNull(),
  street: text().notNull(),
  number: text().notNull(),
  entranceName: text().notNull(),
  // SQLite has no boolean: Drizzle stores 0/1 and gives back false/true
  coordsConfirmed: integer({ mode: "boolean" }).notNull().default(false),
  correctedLat: real(),
  correctedLng: real(),
  addressConfirmed: integer({ mode: "boolean" }).notNull().default(false),
  stories: integer(),
  flats: integer(),
  elevators: integer(),
  yearBuilt: integer(),
  groundFloorCommercial: integer({ mode: "boolean" }),
  comment: text(),
  // the type only: the contract's enum checks the value at the edge
  surveyStatus: text().$type<SurveyStatus>().notNull().default("not_started"),
  surveyedBy: text(),
  surveyedAt: text(),
});

// not in the contract: the office's own visits to an entrance
export const surveys = sqliteTable("surveys", {
  id: row.id,
  entranceId: text()
    .notNull()
    .references(() => entrances.id),
  surveyedOn: text().notNull(),
  surveyor: text().notNull(),
  notes: text(),
});
