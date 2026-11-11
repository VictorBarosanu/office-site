// apps/server/src/entrances.ts — the entrances API; the SQL lives in src/db/
import { fieldErrors, NewEntrance } from "@office/shared";
import { Hono } from "hono";
import {
  createEntrance,
  deleteEntrance,
  getEntrance,
  listEntrances,
  searchEntrances,
} from "./db/entrances";
import { isForeignKeyError } from "./db/errors";

export const entrancesApi = new Hono();

// GET /api/entrances?q=unirii searches the addresses; no q, the whole list
entrancesApi.get("/", (c) => {
  const q = c.req.query("q");
  return c.json(q ? searchEntrances(q) : listEntrances());
});

// GET /api/entrances/<id>: one entrance, or 404
entrancesApi.get("/:id", (c) => {
  const entrance = getEntrance(c.req.param("id"));
  return entrance
    ? c.json(entrance)
    : c.json({ error: "No such entrance" }, 404);
});

entrancesApi.post("/", async (c) => {
  const result = NewEntrance.safeParse(await c.req.json().catch(() => null));
  if (!result.success) {
    return c.json({ errors: fieldErrors(result.error) }, 400);
  }
  try {
    return c.json(createEntrance(result.data), 201);
  } catch (error) {
    // the schema cannot know which buildings exist; the foreign key does
    if (isForeignKeyError(error)) {
      return c.json({ errors: { buildingId: ["No such building"] } }, 400);
    }
    throw error;
  }
});

entrancesApi.delete("/:id", (c) => {
  try {
    if (deleteEntrance(c.req.param("id")) === 0) {
      return c.json({ error: "No such entrance" }, 404);
    }
    return c.body(null, 204);
  } catch (error) {
    if (isForeignKeyError(error)) {
      return c.json({ error: "The entrance has surveys" }, 409);
    }
    throw error;
  }
});
