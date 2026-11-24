// apps/server/src/db/routes.ts — the queries for routes and their stops
import type { NewRoute } from "@office/shared";
import { and, asc, desc, eq } from "drizzle-orm";
import type { Route, RouteStop } from "field-app-contract/contract";
import { db } from "../db";
import { iso } from "./iso";
import { routeStops, routes } from "./schema";

// a route as the contract's fixture has it: the row and its stops, in order
export type RouteWithStops = Route & { stops: RouteStop[] };

// every route, or one field worker's
export async function listRoutes(workerId?: string): Promise<RouteWithStops[]> {
  const all = await db
    .select()
    .from(routes)
    .where(workerId ? eq(routes.workerId, workerId) : undefined)
    .orderBy(desc(routes.date), asc(routes.name));
  const stops = (
    await db.select().from(routeStops).orderBy(asc(routeStops.order))
  ).map(iso);
  return all.map((route) => ({
    ...iso(route),
    stops: stops.filter((stop) => stop.routeId === route.id),
  }));
}

// one route, if it is there and (for a field worker) theirs
export async function getRoute(
  id: string,
  workerId?: string
): Promise<RouteWithStops | undefined> {
  const [route] = await db
    .select()
    .from(routes)
    .where(
      and(
        eq(routes.id, id),
        workerId ? eq(routes.workerId, workerId) : undefined
      )
    );
  if (!route) {
    return undefined;
  }
  const stops = await db
    .select()
    .from(routeStops)
    .where(eq(routeStops.routeId, id))
    .orderBy(asc(routeStops.order));
  return { ...iso(route), stops: stops.map(iso) };
}

// one transaction: the route and every stop go in together, or nothing does
// adminId: the admin who is signed in
export function createRoute(
  { entranceIds, ...route }: NewRoute,
  adminId: string
): Promise<RouteWithStops> {
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(routes)
      .values({ ...route, adminId })
      .returning();
    if (!created) {
      throw new Error("INSERT … RETURNING gave back no row");
    }
    const stops = await tx
      .insert(routeStops)
      .values(
        entranceIds.map((entranceId, i) => ({
          entranceId,
          order: i + 1,
          routeId: created.id,
        }))
      )
      .returning();
    return { ...iso(created), stops: stops.map(iso) };
  });
}
