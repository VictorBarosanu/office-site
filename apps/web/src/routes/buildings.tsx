// apps/web/src/routes/buildings.tsx — the page at /buildings
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pager, pageSearch } from "../Pager";
import { buildingsQuery } from "../queries";

// biome-ignore assist/source/useSortedKeys: the router infers each option from the ones above it
export const Route = createFileRoute("/buildings")({
  validateSearch: pageSearch,
  // the loader runs again whenever offset changes
  loaderDeps: ({ search }) => ({ offset: search.offset }),
  // from the cache when it is there, from the server when it is not
  loader: ({ context, deps }) =>
    context.queryClient.query({
      ...buildingsQuery(deps.offset),
      staleTime: "static",
    }),
  component: Buildings,
});

function Buildings() {
  const { offset } = Route.useSearch();
  // the same key: the data the loader put in the cache, kept up to date
  const { data: page } = useSuspenseQuery(buildingsQuery(offset));
  const buildings = page.items;
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
      <Pager {...page} />
    </>
  );
}
