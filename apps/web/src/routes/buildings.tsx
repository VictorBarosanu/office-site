// apps/web/src/routes/buildings.tsx — the page at /buildings
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { buildingsQuery } from "../queries";

export const Route = createFileRoute("/buildings")({
  component: Buildings,
  // from the cache when it is there, from the server when it is not
  loader: ({ context }) =>
    context.queryClient.query({ ...buildingsQuery, staleTime: "static" }),
});

function Buildings() {
  // the same key: the data the loader put in the cache, kept up to date
  const { data: buildings } = useSuspenseQuery(buildingsQuery);
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
