// apps/web/src/routes/_authed/forbidden.tsx — the page at /forbidden: a 403, signed in but not allowed
import { createFileRoute, Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/_authed/forbidden")({
  component: Forbidden,
});

function Forbidden() {
  return (
    <>
      <p className="font-mono text-muted-foreground text-sm">403</p>
      <h1 className="font-semibold text-3xl">
        Only an admin can open this page
      </h1>
      <p className="max-w-prose text-muted-foreground">
        You are signed in, but this is an admin's work. Ask an admin if you need
        it done.
      </p>
      <Link className={buttonVariants({ variant: "outline" })} to="/">
        Back home
      </Link>
    </>
  );
}
