// apps/web/src/routes/index.tsx — the page at /
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <>
      <h1>The office</h1>
      <p>
        Plan the survey: the <Link to="/entrances">entrances</Link> to visit and
        the <Link to="/buildings">buildings</Link> they belong to.
      </p>
    </>
  );
}
