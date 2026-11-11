// apps/server/src/db/routes.ts — the queries for routes and their stops
import type { NewRoute } from "@office/shared";
import { asc, desc, eq } from "drizzle-orm";
import type { Route, RouteStop } from "field-app-contract/contract";
import { db } from "../db";
import { routeStops, routes, users } from "./schema";

// a route as the contract's fixture has it: the row and its stops, in order
export type RouteWithStops = Route & { stops: RouteStop[] };

export function listRoutes(): RouteWithStops[] {
  const all = db
    .select()
    .from(routes)
    .orderBy(desc(routes.date), asc(routes.name))
    .all();
  const stops = db
    .select()
    .from(routeStops)
    .orderBy(asc(routeStops.order))
    .all();
  return all.map((route) => ({
    ...route,
    stops: stops.filter((stop) => stop.routeId === route.id),
  }));
}

// one transaction: the route and every stop go in together, or nothing does
export function createRoute({
  entranceIds,
  ...route
}: NewRoute): RouteWithStops {
  return db.transaction((tx) => {
    // no sign-in yet: the first admin assigns every route
    const admin = tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"))
      .orderBy(asc(users.createdAt))
      .get();
    if (!admin) {
      throw new Error("No admin in the users table: run bun run db:seed");
    }
    const created = tx
      .insert(routes)
      .values({ ...route, adminId: admin.id })
      .returning()
      .get();
    const stops = tx
      .insert(routeStops)
      .values(
        entranceIds.map((entranceId, i) => ({
          entranceId,
          order: i + 1,
          routeId: created.id,
        }))
      )
      .returning()
      .all();
    return { ...created, stops };
  });
}
