// apps/server/drizzle.config.ts — where drizzle-kit reads the schema and writes the SQL
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // createdAt in TypeScript, created_at in the database
  casing: "snake_case",
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./src/db/schema.ts",
});
