// apps/web/src/routes/entrances/index.tsx — the page at /entrances
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { EntranceForm } from "../../EntranceForm";
import { buildingsQuery, entrancesQuery } from "../../queries";

export const Route = createFileRoute("/entrances/")({
  component: Entrances,
  // both lists at once: the form needs the buildings, the list the entrances
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.query({ ...entrancesQuery, staleTime: "static" }),
      context.queryClient.query({ ...buildingsQuery, staleTime: "static" }),
    ]),
});

function Entrances() {
  const { data: entrances } = useSuspenseQuery(entrancesQuery);
  const { data: buildings } = useSuspenseQuery(buildingsQuery);
  return (
    <>
      <h1>Entrances</h1>
      {/* the form invalidates ["entrances"]: this list refetches by itself */}
      <EntranceForm buildings={buildings} />
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
