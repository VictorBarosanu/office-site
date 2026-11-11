// apps/web/src/routes/__root.tsx — the frame every page is drawn in
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
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
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  );
}
