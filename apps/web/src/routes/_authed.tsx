// apps/web/src/routes/_authed.tsx — every page behind sign-in: the _ keeps it out of the URL
import { useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { signOut } from "../api";
import { meQuery } from "../queries";

export const Route = createFileRoute("/_authed")({
  // before any page under it loads: who is signed in? Nobody: the sign-in page, then back here
  beforeLoad: async ({ context, location }) => {
    const me = await context.queryClient.query({
      ...meQuery,
      staleTime: "static",
    });
    if (!me) {
      throw redirect({ search: { redirect: location.href }, to: "/sign-in" });
    }
    // every page under it reads context.me
    return { me };
  },
  component: Authed,
});

// a link drawn as a quiet button; the router marks the current page's link
const nav = buttonVariants({ size: "sm", variant: "ghost" });

function Authed() {
  const { me } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    // the next person at this computer must not see this one's cached data
    queryClient.clear();
    await navigate({ to: "/sign-in" });
  }

  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 p-2">
          <nav className="flex flex-wrap gap-1">
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
          <div className="flex items-center gap-2 text-sm">
            <span>{me.name}</span>
            <Badge variant="secondary">{me.role}</Badge>
            <Button onClick={handleSignOut} size="sm" variant="outline">
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4">
        <Outlet />
      </main>
    </>
  );
}
