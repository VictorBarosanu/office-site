// apps/server/src/routes.ts — the routes API (an admin's assignments); the SQL lives in src/db/
import { fieldErrors, NewRoute, RouteWithStops } from "@office/shared";
import type { User } from "field-app-contract/contract";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { isForeignKeyError } from "./db/errors";
import { createRoute, getRoute, listRoutes } from "./db/routes";
import { requireRole, requireUser, type SignedIn } from "./guards";
import { json, jsonBody, problemJson } from "./openapi";
import { problem } from "./problem";

export const routesApi = new Hono<SignedIn>();

routesApi.use(requireUser);

// a field worker sees only their own routes: the object check, after the role check
const workerOf = (user: User) => (user.role === "field" ? user.id : undefined);

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
  (c) => c.json(listRoutes(workerOf(c.get("user"))))
);

// another worker's route answers 404, not 403: a field worker does not learn it exists
routesApi.get(
  "/:id",
  describeRoute({
    responses: {
      200: json("The route and its stops", RouteWithStops),
      404: problemJson("No such route"),
    },
    summary: "One route",
    tags: ["routes"],
  }),
  (c) => {
    const route = getRoute(c.req.param("id"), workerOf(c.get("user")));
    return route ? c.json(route) : problem(c, 404, "No such route");
  }
);

routesApi.post(
  "/",
  requireRole("admin"),
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
      return c.json(createRoute(result.data, c.get("user").id), 201);
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
