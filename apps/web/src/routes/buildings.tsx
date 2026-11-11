// apps/web/src/routes/buildings.tsx — the page at /buildings
import { createFileRoute } from "@tanstack/react-router";
import type { Building } from "field-app-contract/contract";
import { getJson } from "../api";

export const Route = createFileRoute("/buildings")({
  component: Buildings,
  // the router fetches before it draws the page: no empty first render
  loader: () => getJson<Building[]>("/api/buildings"),
});

function Buildings() {
  const buildings = Route.useLoaderData();
  return (
    <>
      <h1>Buildings</h1>
      <ul>
        {buildings.map((building) => (
          <li key={building.id}>
            {building.label}
            {building.comment && ` — ${building.comment}`}
          </li>
        ))}
      </ul>
    </>
  );
}
