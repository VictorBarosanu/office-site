// apps/web/src/routes/__root.tsx — the frame every page is drawn in; the header is _authed.tsx's
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

// what every loader receives as its context: main.tsx passes the cache
export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: Root,
  notFoundComponent: () => (
    <p className="text-muted-foreground">No page here.</p>
  ),
});

function Root() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <Outlet />
    </div>
  );
}
