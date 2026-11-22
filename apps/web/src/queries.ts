// apps/web/src/queries.ts — every read from the server: a key for the cache, a function that fetches
import type { Page } from "@office/shared";
import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import type {
  Building,
  Entrance,
  Route,
  RouteStop,
  User,
} from "field-app-contract/contract";
import { API, getJson } from "./api";

// one page of a list: the page is part of the key, so each page has its own cache entry
export const buildingsQuery = (offset = 0, limit = 10) =>
  queryOptions({
    queryFn: () =>
      getJson<Page<Building>>(`/api/buildings?limit=${limit}&offset=${offset}`),
    queryKey: ["buildings", { limit, offset }],
  });

export const entrancesQuery = (offset = 0, limit = 10) =>
  queryOptions({
    queryFn: () =>
      getJson<Page<Entrance>>(`/api/entrances?limit=${limit}&offset=${offset}`),
    queryKey: ["entrances", { limit, offset }],
  });

// shortcut: the map and the forms need every row and the seed is far below 100;
// past 100 they would page too (the course's slide on cursors is the upgrade)
export const allBuildingsQuery = buildingsQuery(0, 100);
export const allEntrancesQuery = entrancesQuery(0, 100);

// ["entrances", id] sits under ["entrances"]: invalidating the list reaches it too
export const entranceQuery = (id: string) =>
  queryOptions({
    queryFn: async () => {
      const res = await fetch(`${API}/api/entrances/${id}`);
      if (res.status === 404) {
        throw notFound();
      }
      return (await res.json()) as Entrance;
    },
    queryKey: ["entrances", id],
  });

export const workersQuery = queryOptions({
  queryFn: () => getJson<User[]>("/api/users?role=field"),
  queryKey: ["users", "field"],
});

// the contract calls an assignment a Route; the router has routes of its own
export const assignmentsQuery = queryOptions({
  queryFn: () => getJson<(Route & { stops: RouteStop[] })[]>("/api/routes"),
  queryKey: ["routes"],
});
