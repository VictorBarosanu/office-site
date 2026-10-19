// apps/server/src/entrances.ts — the entrances API, in memory until week 4
import type { Entrance } from "@office/shared";
import { Hono } from "hono";

// lost on every restart: week 4 puts it in a database
const entrances: Entrance[] = [
  { id: 1, address: "Str. Lalelelor 4, scara A", floors: 4, hasElevator: false },
  { id: 2, address: "Bd. Unirii 12, scara B", floors: 10, hasElevator: true },
  { id: 3, address: "Calea Victoriei 101", floors: 7, hasElevator: true },
];
let nextId = 4;

export const entrancesApi = new Hono();

entrancesApi.get("/", (c) => c.json(entrances));

entrancesApi.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  // validation by hand: the same three checks as the form's
  const errors: Record<string, string> = {};
  if (typeof body?.address !== "string" || body.address.trim() === "") {
    errors.address = "Address is required";
  }
  if (!Number.isInteger(body?.floors) || body.floors < 0) {
    errors.floors = "Floors must be a whole number, 0 or more";
  }
  if (typeof body?.hasElevator !== "boolean") {
    errors.hasElevator = "Say whether there is an elevator";
  }
  if (Object.keys(errors).length > 0) {
    return c.json({ errors }, 400);
  }
  const entrance: Entrance = {
    id: nextId++,
    address: body.address.trim(),
    floors: body.floors,
    hasElevator: body.hasElevator,
  };
  entrances.push(entrance);
  return c.json(entrance, 201);
});
