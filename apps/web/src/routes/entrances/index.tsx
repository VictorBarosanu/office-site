// apps/web/src/routes/entrances/index.tsx — the page at /entrances
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import type { Building, Entrance } from "field-app-contract/contract";
import { getJson } from "../../api";
import { EntranceForm } from "../../EntranceForm";

export const Route = createFileRoute("/entrances/")({
  component: Entrances,
  // both lists at once: the form needs the buildings, the list the entrances
  loader: async () => {
    const [entrances, buildings] = await Promise.all([
      getJson<Entrance[]>("/api/entrances"),
      getJson<Building[]>("/api/buildings"),
    ]);
    return { buildings, entrances };
  },
});

function Entrances() {
  const { buildings, entrances } = Route.useLoaderData();
  const router = useRouter();
  return (
    <>
      <h1>Entrances</h1>
      {/* a new entrance: run the loader again, the list comes back with it */}
      <EntranceForm
        buildings={buildings}
        onCreated={() => router.invalidate()}
      />
      <ul>
        {entrances.map((entrance) => (
          <li key={entrance.id}>
            <Link
              params={{ entranceId: entrance.id }}
              to="/entrances/$entranceId"
            >
              {entrance.street} {entrance.number}, {entrance.entranceName}
            </Link>{" "}
            ({buildings.find((b) => b.id === entrance.buildingId)?.label}) —{" "}
            {entrance.surveyStatus}
          </li>
        ))}
      </ul>
    </>
  );
}
