import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// written by the router's Vite plugin from the files in src/routes/
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

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
    <RouterProvider router={router} />
  </StrictMode>
);
