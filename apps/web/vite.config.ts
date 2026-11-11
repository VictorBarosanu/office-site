import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  // the router's plugin first: it writes src/routeTree.gen.ts from src/routes/
  plugins: [
    tanstackRouter({ autoCodeSplitting: true, target: "react" }),
    react(),
  ],
});
