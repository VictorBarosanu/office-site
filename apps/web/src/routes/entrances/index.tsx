// apps/web/src/routes/entrances/index.tsx — the page at /entrances
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EntranceForm } from "../../EntranceForm";
import { Pager, pageSearch } from "../../Pager";
import { allBuildingsQuery, entrancesQuery } from "../../queries";
import { StatusBadge } from "../../StatusBadge";

// biome-ignore assist/source/useSortedKeys: the router infers each option from the ones above it
export const Route = createFileRoute("/entrances/")({
  validateSearch: pageSearch,
  loaderDeps: ({ search }) => ({ offset: search.offset }),
  // both at once: a page of entrances, and every building for the form
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.query({
        ...entrancesQuery(deps.offset),
        staleTime: "static",
      }),
      context.queryClient.query({ ...allBuildingsQuery, staleTime: "static" }),
    ]),
  component: Entrances,
});

function Entrances() {
  const { offset } = Route.useSearch();
  const { data: page } = useSuspenseQuery(entrancesQuery(offset));
  const { data: buildings } = useSuspenseQuery(allBuildingsQuery);
  const entrances = page.items;
  return (
    <>
      <h1 className="font-semibold text-3xl">Entrances</h1>
      {/* the form invalidates ["entrances"]: this list refetches by itself */}
      <EntranceForm buildings={buildings.items} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Address</TableHead>
            {/* the building column only from 640px: a phone keeps two */}
            <TableHead className="hidden sm:table-cell">Building</TableHead>
            <TableHead>Survey</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entrances.map((entrance) => (
            <TableRow key={entrance.id}>
              <TableCell className="whitespace-normal">
                <Link
                  className="font-medium underline-offset-4 hover:underline"
                  params={{ entranceId: entrance.id }}
                  to="/entrances/$entranceId"
                >
                  {entrance.street} {entrance.number}, {entrance.entranceName}
                </Link>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {
                  buildings.items.find((b) => b.id === entrance.buildingId)
                    ?.label
                }
              </TableCell>
              <TableCell>
                <StatusBadge status={entrance.surveyStatus} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pager {...page} />
    </>
  );
}
