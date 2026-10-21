// apps/server/src/entrances.ts — the entrances API, in memory until week 4
import { Hono } from "hono";
import type { Entrance } from "@office/shared";

// lost on every restart: week 4 puts it in a database
const entrances: Entrance[] = [
  { id: 1, address: "Str. Lalelelor 4, scara A", floors: 4, hasElevator: false },
  { id: 2, address: "Bd. Unirii 12, scara B", floors: 10, hasElevator: true },
  { id: 3, address: "Calea Victoriei 101", floors: 7, hasElevator: true },
];

export const entrancesApi = new Hono();

entrancesApi.get("/", (c) => c.json(entrances));