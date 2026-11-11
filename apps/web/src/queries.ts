// apps/web/src/queries.ts — every read from the server: a key for the cache, a function that fetches
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

export const buildingsQuery = queryOptions({
  queryFn: () => getJson<Building[]>("/api/buildings"),
  queryKey: ["buildings"],
});

export const entrancesQuery = queryOptions({
  queryFn: () => getJson<Entrance[]>("/api/entrances"),
  queryKey: ["entrances"],
});

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
