// apps/server/src/entrances.ts — the entrances API; the SQL lives in src/db/
import { fieldErrors, NewEntrance, PageQuery } from "@office/shared";
import { Entrance } from "field-app-contract/contract";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import {
  createEntrance,
  deleteEntrance,
  getEntrance,
  listEntrances,
} from "./db/entrances";
import { isForeignKeyError } from "./db/errors";
import {
  json,
  jsonBody,
  pageJson,
  pageParameters,
  problemJson,
} from "./openapi";
import { problem } from "./problem";

export const entrancesApi = new Hono();

// GET /api/entrances?q=unirii&limit=10&offset=0: one page of the matches
entrancesApi.get(
  "/",
  describeRoute({
    parameters: [
      ...(pageParameters ?? []),
      {
        description: "A part of the street",
        in: "query",
        name: "q",
        schema: { type: "string" },
      },
    ],
    responses: {
      200: pageJson("One page of entrances, by address", Entrance),
      400: problemJson("A bad limit or offset"),
    },
    summary: "List or search the entrances",
    tags: ["entrances"],
  }),
  (c) => {
    const page = PageQuery.safeParse(c.req.query());
    if (!page.success) {
      return problem(c, 400, "limit is 1 to 100, offset 0 or more", {
        errors: fieldErrors(page.error),
      });
    }
    return c.json(listEntrances(page.data, c.req.query("q")));
  }
);

// GET /api/entrances/<id>: one entrance, or 404
entrancesApi.get(
  "/:id",
  describeRoute({
    responses: {
      200: json("The entrance", Entrance),
      404: problemJson("No such entrance"),
    },
    summary: "One entrance",
    tags: ["entrances"],
  }),
  (c) => {
    const entrance = getEntrance(c.req.param("id"));
    return entrance ? c.json(entrance) : problem(c, 404, "No such entrance");
  }
);

entrancesApi.post(
  "/",
  describeRoute({
    requestBody: jsonBody(NewEntrance),
    responses: {
      201: json("The entrance, with its id", Entrance),
      400: problemJson("Not a valid entrance, or no such building"),
    },
    summary: "Place an entrance",
    tags: ["entrances"],
  }),
  async (c) => {
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
  }
);

entrancesApi.delete(
  "/:id",
  describeRoute({
    responses: {
      204: { description: "Deleted" },
      404: problemJson("No such entrance"),
      409: problemJson("The entrance has surveys"),
    },
    summary: "Delete an entrance",
    tags: ["entrances"],
  }),
  (c) => {
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
  }
);
