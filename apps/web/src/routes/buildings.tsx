// apps/web/src/routes/buildings.tsx — the page at /buildings
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pager, pageSearch } from "../Pager";
import { buildingsQuery } from "../queries";

// biome-ignore assist/source/useSortedKeys: the router infers each option from the ones above it
export const Route = createFileRoute("/buildings")({
  validateSearch: pageSearch.extend({ q: z.string().catch("").default("") }),
  // the loader runs again whenever offset or q changes
  loaderDeps: ({ search }) => ({ offset: search.offset, q: search.q }),
  // from the cache when it is there, from the server when it is not
  loader: ({ context, deps }) =>
    context.queryClient.query({
      ...buildingsQuery(deps.offset, 20, deps.q),
      staleTime: "static",
    }),
  component: Buildings,
});

function Buildings() {
  const { offset, q } = Route.useSearch();
  // the same key: the data the loader put in the cache, kept up to date
  const { data: page } = useSuspenseQuery(buildingsQuery(offset, 20, q));
  const buildings = page.items;
  const navigate = useNavigate({ from: "/buildings" });
  return (
    <>
      <h1 className="font-semibold text-3xl">Buildings</h1>
      {/* <search>: the landmark a screen reader jumps to; the query goes in the URL, ?q=… */}
      <search>
        <form
          className="flex max-w-md gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const text = new FormData(e.currentTarget).get("q");
            // a new search: the whole query string is q, so offset is back to 0
            navigate({ search: { q: String(text ?? "").trim() } });
          }}
        >
          <Input
            aria-label="Search the buildings"
            defaultValue={q}
            key={q}
            name="q"
            placeholder="Search: a label, a word of a comment"
            type="search"
          />
          <Button type="submit">Search</Button>
        </form>
      </search>
      {q && page.total === 0 ? (
        <p className="text-muted-foreground">No building matches “{q}”.</p>
      ) : null}
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
