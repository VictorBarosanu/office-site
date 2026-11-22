// apps/server/src/buildings.ts — the buildings API; the SQL lives in src/db/
import { fieldErrors, NewBuilding, PageQuery } from "@office/shared";
import { Hono } from "hono";
import { createBuilding, deleteBuilding, listBuildings } from "./db/buildings";
import { isForeignKeyError } from "./db/errors";
import { problem } from "./problem";

export const buildingsApi = new Hono();

// GET /api/buildings?limit=10&offset=0: one page, and the total
buildingsApi.get("/", (c) => {
  const page = PageQuery.safeParse(c.req.query());
  if (!page.success) {
    return problem(c, 400, "limit is 1 to 100, offset 0 or more", {
      errors: fieldErrors(page.error),
    });
  }
  return c.json(listBuildings(page.data));
});

buildingsApi.post("/", async (c) => {
  const result = NewBuilding.safeParse(await c.req.json().catch(() => null));
  if (!result.success) {
    return problem(c, 400, "The building is not valid", {
      errors: fieldErrors(result.error),
    });
  }
  return c.json(createBuilding(result.data), 201);
});

buildingsApi.delete("/:id", (c) => {
  try {
    if (deleteBuilding(c.req.param("id")) === 0) {
      return problem(c, 404, "No such building");
    }
    return c.body(null, 204);
  } catch (error) {
    // entrances still point at it: the foreign key refuses the delete
    if (isForeignKeyError(error)) {
      return problem(c, 409, "The building still has entrances");
    }
    throw error;
  }
});
