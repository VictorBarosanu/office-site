// apps/server/src/db/routes.ts — the queries for routes and their stops
import type { NewRoute } from "@office/shared";
import { and, asc, desc, eq } from "drizzle-orm";
import type { Route, RouteStop } from "field-app-contract/contract";
import { db } from "../db";
import { routeStops, routes } from "./schema";

// a route as the contract's fixture has it: the row and its stops, in order
export type RouteWithStops = Route & { stops: RouteStop[] };

// every route, or one field worker's
export function listRoutes(workerId?: string): RouteWithStops[] {
  const all = db
    .select()
    .from(routes)
    .where(workerId ? eq(routes.workerId, workerId) : undefined)
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

// one route, if it is there and (for a field worker) theirs
export function getRoute(
  id: string,
  workerId?: string
): RouteWithStops | undefined {
  const route = db
    .select()
    .from(routes)
    .where(
      and(
        eq(routes.id, id),
        workerId ? eq(routes.workerId, workerId) : undefined
      )
    )
    .get();
  if (!route) {
    return undefined;
  }
  const stops = db
    .select()
    .from(routeStops)
    .where(eq(routeStops.routeId, id))
    .orderBy(asc(routeStops.order))
    .all();
  return { ...route, stops };
}

// one transaction: the route and every stop go in together, or nothing does
// adminId: the admin who is signed in
export function createRoute(
  { entranceIds, ...route }: NewRoute,
  adminId: string
): RouteWithStops {
  return db.transaction((tx) => {
    const created = tx
      .insert(routes)
      .values({ ...route, adminId })
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
