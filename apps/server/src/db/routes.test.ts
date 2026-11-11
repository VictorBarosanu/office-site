// apps/server/src/db/routes.test.ts — routes and their stops against a :memory: database
import { beforeAll, expect, test } from "bun:test";
import { Route, RouteStop } from "field-app-contract/contract";
import { migrate } from "../../scripts/migrate";
import { seed } from "../../scripts/seed";
import { db } from "../db";
import { createRoute, listRoutes } from "./routes";

const ANDREI = "26bc4094-d586-4223-9561-ef242d835677"; // a field worker, a fixture
const LIPSCANI_A = "2511ddfb-2828-46f5-b23c-39501d862310"; // an entrance, a fixture

beforeAll(() => {
  if (db.$client.filename !== ":memory:") {
    throw new Error(`Refusing to test on ${db.$client.filename}`);
  }
  migrate();
  seed();
});

test("the seed brings the contract's 2 routes back with their stops in order", () => {
  const listed = listRoutes();
  expect(listed).toHaveLength(2);
  for (const route of listed) {
    expect(Route.parse(route)).toBeDefined();
    expect(route.stops.map((s) => s.order)).toEqual(
      route.stops.map((_, i) => i + 1)
    );
  }
});

test("a new route is assigned by the admin, its stops numbered from 1", () => {
  const created = createRoute({
    date: "2026-11-12",
    entranceIds: [LIPSCANI_A],
    name: "Test route",
    workerId: ANDREI,
  });
  expect(Route.parse(created).adminId).toBe(
    "7d07e973-eebc-44b1-b7cd-bd1cd2fff3c5"
  );
  expect(created.stops).toHaveLength(1);
  expect(RouteStop.parse(created.stops[0])).toMatchObject({
    entranceId: LIPSCANI_A,
    order: 1,
    status: "todo",
  });
});

test("an unknown entrance refuses the whole route, stops and all", () => {
  const before = listRoutes().length;
  expect(() =>
    createRoute({
      date: "2026-11-12",
      entranceIds: [LIPSCANI_A, crypto.randomUUID()],
      name: "Half a route",
      workerId: ANDREI,
    })
  ).toThrow();
  expect(listRoutes()).toHaveLength(before);
});
