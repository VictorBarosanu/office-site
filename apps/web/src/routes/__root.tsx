// apps/web/src/routes/__root.tsx — the frame every page is drawn in
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";

// what every loader receives as its context: main.tsx passes the cache
export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: Root,
  notFoundComponent: () => (
    <p className="text-muted-foreground">No page here.</p>
  ),
});

// a link drawn as a quiet button; the router marks the current page's link
const nav = buttonVariants({ size: "sm", variant: "ghost" });

function Root() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b">
        <nav className="mx-auto flex max-w-5xl flex-wrap gap-1 p-2">
          {/* activeOptions.exact: "/" would otherwise be active on every page */}
          <Link
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-muted" }}
            className={nav}
            to="/"
          >
            Home
          </Link>
          <Link
            activeProps={{ className: "bg-muted" }}
            className={nav}
            to="/entrances"
          >
            Entrances
          </Link>
          <Link
            activeProps={{ className: "bg-muted" }}
            className={nav}
            to="/buildings"
          >
            Buildings
          </Link>
          <Link
            activeProps={{ className: "bg-muted" }}
            className={nav}
            to="/assignments"
          >
            Assignments
          </Link>
          <Link
            activeProps={{ className: "bg-muted" }}
            className={nav}
            to="/map"
          >
            Map
          </Link>
        </nav>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4">
        <Outlet />
      </main>
    </div>
  );
}
