// apps/server/src/buildings.ts — the buildings API; the SQL lives in src/db/
import { fieldErrors, NewBuilding, PageQuery } from "@office/shared";
import { Building } from "field-app-contract/contract";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import {
  createBuilding,
  deleteBuilding,
  listBuildings,
  searchBuildings,
  toMatchQuery,
} from "./db/buildings";
import { isForeignKeyError } from "./db/errors";
import {
  json,
  jsonBody,
  pageJson,
  pageParameters,
  problemJson,
} from "./openapi";
import { problem } from "./problem";

export const buildingsApi = new Hono();

// GET /api/buildings?limit=10&offset=0: one page, and the total
buildingsApi.get(
  "/",
  describeRoute({
    parameters: pageParameters,
    responses: {
      200: pageJson("One page of buildings, by label", Building),
      400: problemJson("A bad limit or offset"),
    },
    summary: "List the buildings",
    tags: ["buildings"],
  }),
  (c) => {
    const page = PageQuery.safeParse(c.req.query());
    if (!page.success) {
      return problem(c, 400, "limit is 1 to 100, offset 0 or more", {
        errors: fieldErrors(page.error),
      });
    }
    return c.json(listBuildings(page.data));
  }
);

// GET /api/buildings/search?q=lipscani: the best matches first, a page at a time
buildingsApi.get(
  "/search",
  describeRoute({
    parameters: [
      { in: "query", name: "q", required: true, schema: { type: "string" } },
      ...(pageParameters ?? []),
    ],
    responses: {
      200: pageJson("One page of matches, the best first", Building),
      400: problemJson("No q, or a bad limit or offset"),
    },
    summary: "Search the buildings' labels and comments",
    tags: ["buildings"],
  }),
  (c) => {
    const page = PageQuery.safeParse(c.req.query());
    if (!page.success) {
      return problem(c, 400, "limit is 1 to 100, offset 0 or more", {
        errors: fieldErrors(page.error),
      });
    }
    const q = c.req.query("q")?.trim();
    if (!q) {
      return problem(c, 400, "q is required: the words to search for", {
        errors: { q: ["Type a word to search for"] },
      });
    }
    // "!!!" has no word in it: nothing can match
    const match = toMatchQuery(q);
    return c.json(
      match
        ? searchBuildings(match, page.data)
        : { items: [], ...page.data, total: 0 }
    );
  }
);

buildingsApi.post(
  "/",
  describeRoute({
    requestBody: jsonBody(NewBuilding),
    responses: {
      201: json("The building, with its id", Building),
      400: problemJson("Not a valid building"),
    },
    summary: "Add a building",
    tags: ["buildings"],
  }),
  async (c) => {
    const result = NewBuilding.safeParse(await c.req.json().catch(() => null));
    if (!result.success) {
      return problem(c, 400, "The building is not valid", {
        errors: fieldErrors(result.error),
      });
    }
    return c.json(createBuilding(result.data), 201);
  }
);

buildingsApi.delete(
  "/:id",
  describeRoute({
    responses: {
      204: { description: "Deleted" },
      404: problemJson("No such building"),
      409: problemJson("The building still has entrances"),
    },
    summary: "Delete a building",
    tags: ["buildings"],
  }),
  (c) => {
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
  }
);
