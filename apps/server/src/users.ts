// apps/server/src/users.ts — the users API; the SQL lives in src/db/
import { Role } from "field-app-contract/contract";
import { Hono } from "hono";
import { listUsers } from "./db/users";

export const usersApi = new Hono();

// GET /api/users?role=field lists the field workers; no role, everyone
usersApi.get("/", (c) => {
  const role = Role.safeParse(c.req.query("role"));
  return c.json(listUsers(role.success ? role.data : undefined));
});
