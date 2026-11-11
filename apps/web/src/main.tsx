import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// written by the router's Vite plugin from the files in src/routes/
import { routeTree } from "./routeTree.gen";

// one cache for the whole app: every page reads the server's data through it
const queryClient = new QueryClient();

const router = createRouter({
  // every loader gets the cache as context.queryClient
  context: { queryClient },
  // hovering a link starts its loader: the page is often ready on click
  defaultPreload: "intent",
  routeTree,
});

// every Link, every useParams knows the app's routes: a typo is a type error
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const root = document.getElementById("root");
if (!root) {
  throw new Error('index.html has no <div id="root">');
}

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* the flower in the corner: the cache, live; left out of a production build */}
      <ReactQueryDevtools />
    </QueryClientProvider>
  </StrictMode>
);
