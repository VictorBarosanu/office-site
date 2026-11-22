// apps/server/src/buildings.ts — the buildings API; the SQL lives in src/db/
import { fieldErrors, NewBuilding, PageQuery } from "@office/shared";
import { Building } from "field-app-contract/contract";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { createBuilding, deleteBuilding, listBuildings } from "./db/buildings";
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
