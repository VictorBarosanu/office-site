// apps/server/src/db/schema.ts — the tables in TypeScript; drizzle-kit writes the SQL
// biome-ignore-all assist/source/useSortedKeys: the order of the keys is the order of the columns

import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type {
  Role,
  StopStatus,
  SurveyStatus,
} from "field-app-contract/contract";

// an instant: Postgres keeps it in UTC, Drizzle gives back a JavaScript Date
const instant = () => timestamp({ mode: "date", withTimezone: true });

// every contract entity has these three: a UUID and two timestamps
const row = {
  id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdAt: instant().notNull().defaultNow(),
  updatedAt: instant()
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
};

// Postgres's search type, which Drizzle has no helper for: the words of a text, normalised
const tsvector = customType<{ data: string }>({
  dataType: () => "tsvector",
});

// the contract's Building, field for field, and the words the search looks in
export const buildings = pgTable(
  "buildings",
  {
    ...row,
    label: text().notNull(),
    comment: text(),
    // Postgres keeps it up to date on every write; 'office' is the migration's own configuration:
    // no English stemming of Romanian, and no accents ("franceza" is "franceză")
    search: tsvector().generatedAlwaysAs(
      sql`to_tsvector('office', label || ' ' || coalesce(comment, ''))`
    ),
  },
  (table) => [index("buildings_search_idx").using("gin", table.search)]
);

// the contract's Entrance: the office's placement, then the surveyed fields
export const entrances = pgTable("entrances", {
  ...row,
  buildingId: text()
    .notNull()
    .references(() => buildings.id),
  // double precision: real would keep only 6 or 7 digits of a coordinate
  lat: doublePrecision().notNull(),
  lng: doublePrecision().notNull(),
  street: text().notNull(),
  number: text().notNull(),
  entranceName: text().notNull(),
  // Postgres has a real boolean
  coordsConfirmed: boolean().notNull().default(false),
  correctedLat: doublePrecision(),
  correctedLng: doublePrecision(),
  addressConfirmed: boolean().notNull().default(false),
  stories: integer(),
  flats: integer(),
  elevators: integer(),
  yearBuilt: integer(),
  groundFloorCommercial: boolean(),
  comment: text(),
  // the type only: the contract's enum checks the value at the edge
  surveyStatus: text().$type<SurveyStatus>().notNull().default("not_started"),
  surveyedBy: text(),
  surveyedAt: instant(),
});

// not in the contract: the office's own visits to an entrance
export const surveys = pgTable("surveys", {
  id: row.id,
  entranceId: text()
    .notNull()
    .references(() => entrances.id),
  // a day, not an instant: mode "string" keeps the contract's 2026-11-25
  surveyedOn: date({ mode: "string" }).notNull(),
  surveyor: text().notNull(),
  notes: text(),
});

// the contract's User: the office's admins and the field workers; Better Auth's "user"
export const users = pgTable("users", {
  ...row,
  role: text().$type<Role>().notNull(),
  name: text().notNull(),
  email: text().notNull().unique(),
  // Better Auth's two: has the person shown they read this inbox, and a picture (GitHub's)
  emailVerified: boolean().notNull().default(false),
  image: text(),
});

// the contract's Route: an admin gives a field worker a day's entrances
export const routes = pgTable("routes", {
  ...row,
  adminId: text()
    .notNull()
    .references(() => users.id),
  workerId: text()
    .notNull()
    .references(() => users.id),
  date: date({ mode: "string" }).notNull(),
  name: text().notNull(),
});

// the contract's RouteStop: one entrance of a route, in the order to visit it
export const routeStops = pgTable("route_stops", {
  ...row,
  routeId: text()
    .notNull()
    .references(() => routes.id, { onDelete: "cascade" }),
  entranceId: text()
    .notNull()
    .references(() => entrances.id),
  order: integer().notNull(),
  status: text().$type<StopStatus>().notNull().default("todo"),
});

// Better Auth's account table: a password is a "credential" account, its accountId the
// user's id; a GitHub sign-in is a "github" account, its accountId GitHub's user id
export const account = pgTable("account", {
  id: row.id,
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text().notNull(),
  providerId: text().notNull(),
  // what GitHub gives back at sign-in (step 7); empty for a password
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: instant(),
  refreshTokenExpiresAt: instant(),
  scope: text(),
  // the Bun.password hash (argon2id), never the password
  password: text(),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

// Better Auth's session table: the token is the cookie's value; signing out deletes the row
export const session = pgTable("session", {
  id: row.id,
  token: text().notNull().unique(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: instant().notNull(),
  ipAddress: text(),
  userAgent: text(),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

// Better Auth's one-time values: an email's verify link, a reset link, a sign-in's state
export const verification = pgTable("verification", {
  id: row.id,
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: instant().notNull(),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
