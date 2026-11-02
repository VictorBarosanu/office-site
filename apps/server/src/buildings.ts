// apps/server/src/buildings.ts — the buildings API; the SQL lives in src/db/
import { fieldErrors, NewBuilding } from "@office/shared";
import { Hono } from "hono";
import { createBuilding, listBuildings } from "./db/buildings";

export const buildingsApi = new Hono();

buildingsApi.get("/", (c) => c.json(listBuildings()));

buildingsApi.post("/", async (c) => {
  const result = NewBuilding.safeParse(await c.req.json().catch(() => null));
  if (!result.success) {
    return c.json({ errors: fieldErrors(result.error) }, 400);
  }
  return c.json(createBuilding(result.data), 201);
});
