// apps/web/src/routes/assignments/index.tsx — the page at /assignments
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
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
      <h1>Assignments</h1>
      <p>
        <Link to="/assignments/new">New assignment</Link>
      </p>
      <ul>
        {assignments.map((a) => (
          <li key={a.id}>
            {a.date} — {a.name}:{" "}
            {workers.find((w) => w.id === a.workerId)?.name}, {a.stops.length}{" "}
            {a.stops.length === 1 ? "entrance" : "entrances"}
          </li>
        ))}
      </ul>
    </>
  );
}
