// apps/web/src/routes/__root.tsx — the frame every page is drawn in
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";

// what every loader receives as its context: main.tsx passes the cache
export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: Root,
  notFoundComponent: () => <p>No page here.</p>,
});

function Root() {
  return (
    <>
      <nav>
        {/* activeOptions.exact: "/" would otherwise be active on every page */}
        <Link activeOptions={{ exact: true }} to="/">
          Home
        </Link>
        <Link to="/entrances">Entrances</Link>
        <Link to="/buildings">Buildings</Link>
        <Link to="/assignments">Assignments</Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  );
}
