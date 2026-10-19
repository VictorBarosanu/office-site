// apps/server/src/entrances.ts — the entrances API, in memory until week 4
import { type Entrance, fieldErrors, NewEntrance } from "@office/shared";
import { Hono } from "hono";

// lost on every restart: week 4 puts it in a database
const entrances: Entrance[] = [
  {
    address: "Str. Lalelelor 4, scara A",
    floors: 4,
    hasElevator: false,
    id: 1,
  },
  { address: "Bd. Unirii 12, scara B", floors: 10, hasElevator: true, id: 2 },
  { address: "Calea Victoriei 101", floors: 7, hasElevator: true, id: 3 },
];
let nextId = 4;

export const entrancesApi = new Hono();

entrancesApi.get("/", (c) => c.json(entrances));

entrancesApi.post("/", async (c) => {
  const result = NewEntrance.safeParse(await c.req.json().catch(() => null));
  if (!result.success) {
    return c.json({ errors: fieldErrors(result.error) }, 400);
  }
  const entrance: Entrance = { id: nextId, ...result.data };
  nextId += 1;
  entrances.push(entrance);
  return c.json(entrance, 201);
});
