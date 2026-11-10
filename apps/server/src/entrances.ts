// apps/server/src/entrances.ts — the entrances API; the SQL lives in src/db/
import { fieldErrors, NewEntrance } from "@office/shared";
import { Hono } from "hono";

import {
  createEntrance,
  deleteEntrance,
  listEntrances,
  searchEntrances,
} from "./db/entrances";

export const entrancesApi = new Hono();

entrancesApi.get("/", (c) => {
  const q = c.req.query("q");
  return c.json(q ? searchEntrances(q) : listEntrances());
});

entrancesApi.post("/", async (c) => {
  const result = NewEntrance.safeParse(await c.req.json().catch(() => null));
  if (!result.success) {
    return c.json({ errors: fieldErrors(result.error) }, 400);
  }
  return c.json(createEntrance(result.data), 201);
});

entrancesApi.delete("/:id", (c) => {
  if (deleteEntrance(c.req.param("id")) === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.body(null, 204);
});
