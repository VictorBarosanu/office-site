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
import { buildingsQuery, entrancesQuery } from "../../queries";
import { StatusBadge } from "../../StatusBadge";

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
      <h1 className="font-semibold text-3xl">Entrances</h1>
      {/* the form invalidates ["entrances"]: this list refetches by itself */}
      <EntranceForm buildings={buildings} />
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
                {buildings.find((b) => b.id === entrance.buildingId)?.label}
              </TableCell>
              <TableCell>
                <StatusBadge status={entrance.surveyStatus} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
