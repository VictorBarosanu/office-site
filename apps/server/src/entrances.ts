// apps/server/src/entrances.ts — the entrances API; the SQL lives in src/db/
import { fieldErrors, NewEntrance, PageQuery } from "@office/shared";
import { Hono } from "hono";
import {
  createEntrance,
  deleteEntrance,
  getEntrance,
  listEntrances,
} from "./db/entrances";
import { isForeignKeyError } from "./db/errors";
import { problem } from "./problem";

export const entrancesApi = new Hono();

// GET /api/entrances?q=unirii&limit=10&offset=0: one page of the matches
entrancesApi.get("/", (c) => {
  const page = PageQuery.safeParse(c.req.query());
  if (!page.success) {
    return problem(c, 400, "limit is 1 to 100, offset 0 or more", {
      errors: fieldErrors(page.error),
    });
  }
  return c.json(listEntrances(page.data, c.req.query("q")));
});

// GET /api/entrances/<id>: one entrance, or 404
entrancesApi.get("/:id", (c) => {
  const entrance = getEntrance(c.req.param("id"));
  return entrance ? c.json(entrance) : problem(c, 404, "No such entrance");
});

entrancesApi.post("/", async (c) => {
  const result = NewEntrance.safeParse(await c.req.json().catch(() => null));
  if (!result.success) {
    return problem(c, 400, "The entrance is not valid", {
      errors: fieldErrors(result.error),
    });
  }
  try {
    return c.json(createEntrance(result.data), 201);
  } catch (error) {
    // the schema cannot know which buildings exist; the foreign key does
    if (isForeignKeyError(error)) {
      return problem(c, 400, "The entrance is not valid", {
        errors: { buildingId: ["No such building"] },
      });
    }
    throw error;
  }
});

entrancesApi.delete("/:id", (c) => {
  try {
    if (deleteEntrance(c.req.param("id")) === 0) {
      return problem(c, 404, "No such entrance");
    }
    return c.body(null, 204);
  } catch (error) {
    if (isForeignKeyError(error)) {
      return problem(c, 409, "The entrance has surveys");
    }
    throw error;
  }
});
