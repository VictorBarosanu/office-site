// apps/server/src/routes.ts — the routes API (an admin's assignments); the SQL lives in src/db/
import { fieldErrors, NewRoute } from "@office/shared";
import { Hono } from "hono";
import { isForeignKeyError } from "./db/errors";
import { createRoute, listRoutes } from "./db/routes";

export const routesApi = new Hono();

routesApi.get("/", (c) => c.json(listRoutes()));

routesApi.post("/", async (c) => {
  const result = NewRoute.safeParse(await c.req.json().catch(() => null));
  if (!result.success) {
    return c.json({ errors: fieldErrors(result.error) }, 400);
  }
  try {
    return c.json(createRoute(result.data), 201);
  } catch (error) {
    // an unknown worker or entrance: the foreign keys refuse the whole route
    if (isForeignKeyError(error)) {
      return c.json(
        { errors: { entranceIds: ["No such worker or entrance"] } },
        400
      );
    }
    throw error;
  }
});
