// apps/server/drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  casing: "snake_case",
  dbCredentials: {
    url: "./data/office.sqlite",
  },
  dialect: "sqlite",
  out: "./drizzle",
  schema: "./src/db/schema.ts",
});
