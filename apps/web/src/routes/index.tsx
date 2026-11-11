// apps/web/src/routes/index.tsx — the page at /
import { createFileRoute, Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <>
      <h1 className="font-semibold text-3xl">The office</h1>
      <p className="max-w-prose text-muted-foreground">
        Plan the survey: the entrances to visit, the buildings they belong to,
        and who visits them on which day.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link className={buttonVariants()} to="/entrances">
          Entrances
        </Link>
        <Link className={buttonVariants({ variant: "outline" })} to="/map">
          The map
        </Link>
      </div>
    </>
  );
}
