// apps/server/src/routes.ts — the routes API (an admin's assignments); the SQL lives in src/db/
import { fieldErrors, NewRoute, RouteWithStops } from "@office/shared";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { isForeignKeyError } from "./db/errors";
import { createRoute, listRoutes } from "./db/routes";
import { json, jsonBody, problemJson } from "./openapi";
import { problem } from "./problem";

export const routesApi = new Hono();

routesApi.get(
  "/",
  describeRoute({
    responses: {
      200: json(
        "Every route with its stops, newest first",
        RouteWithStops.array()
      ),
    },
    summary: "List the routes",
    tags: ["routes"],
  }),
  (c) => c.json(listRoutes())
);

routesApi.post(
  "/",
  describeRoute({
    requestBody: jsonBody(NewRoute),
    responses: {
      201: json("The route and its stops", RouteWithStops),
      400: problemJson("Not a valid route, or no such worker or entrance"),
    },
    summary: "Assign a route",
    tags: ["routes"],
  }),
  async (c) => {
    const result = NewRoute.safeParse(await c.req.json().catch(() => null));
    if (!result.success) {
      return problem(c, 400, "The route is not valid", {
        errors: fieldErrors(result.error),
      });
    }
    try {
      return c.json(createRoute(result.data), 201);
    } catch (error) {
      // an unknown worker or entrance: the foreign keys refuse the whole route
      if (isForeignKeyError(error)) {
        return problem(c, 400, "The route is not valid", {
          errors: { entranceIds: ["No such worker or entrance"] },
        });
      }
      throw error;
    }
  }
);
