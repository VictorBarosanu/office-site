// apps/web/src/routes/assignments/index.tsx — the page at /assignments
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { assignmentsQuery, workersQuery } from "../../queries";

export const Route = createFileRoute("/assignments/")({
  component: Assignments,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.query({ ...assignmentsQuery, staleTime: "static" }),
      context.queryClient.query({ ...workersQuery, staleTime: "static" }),
    ]),
});

function Assignments() {
  const { data: assignments } = useSuspenseQuery(assignmentsQuery);
  const { data: workers } = useSuspenseQuery(workersQuery);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-semibold text-3xl">Assignments</h1>
        <Link className={buttonVariants()} to="/assignments/new">
          New assignment
        </Link>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Day</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Worker</TableHead>
            <TableHead className="text-right">Entrances</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((a) => (
            <TableRow key={a.id}>
              <TableCell>{a.date}</TableCell>
              <TableCell className="whitespace-normal">{a.name}</TableCell>
              <TableCell>
                {workers.find((w) => w.id === a.workerId)?.name}
              </TableCell>
              <TableCell className="text-right">{a.stops.length}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
