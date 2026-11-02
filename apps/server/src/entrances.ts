// apps/server/src/entrances.ts — the entrances API; the SQL lives in src/db/
import { fieldErrors, NewEntrance } from "@office/shared";
import { Hono } from "hono";
import { createEntrance, listEntrances } from "./db/entrances";

export const entrancesApi = new Hono();

entrancesApi.get("/", (c) => c.json(listEntrances()));

entrancesApi.post("/", async (c) => {
  const result = NewEntrance.safeParse(await c.req.json().catch(() => null));
  if (!result.success) {
    return c.json({ errors: fieldErrors(result.error) }, 400);
  }
  return c.json(createEntrance(result.data), 201);
});
