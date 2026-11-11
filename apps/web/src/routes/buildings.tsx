// apps/web/src/routes/buildings.tsx — the page at /buildings
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <h1 className="font-semibold text-3xl">Buildings</h1>
      {/* one column on a phone, two from 640px (sm), three from 1024px (lg) */}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {buildings.map((building) => (
          <li key={building.id}>
            <Card>
              <CardHeader>
                <CardTitle>{building.label}</CardTitle>
                <CardDescription>
                  {building.comment ?? "No comment"}
                </CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
