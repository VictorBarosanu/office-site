// apps/server/src/users.ts — the users API; the SQL lives in src/db/
import { Role, User } from "field-app-contract/contract";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { listUsers } from "./db/users";
import { json } from "./openapi";

export const usersApi = new Hono();

// GET /api/users?role=field lists the field workers; no role, everyone
usersApi.get(
  "/",
  describeRoute({
    parameters: [
      {
        in: "query",
        name: "role",
        schema: { enum: Role.options, type: "string" },
      },
    ],
    responses: { 200: json("Everyone, or one role, by name", User.array()) },
    summary: "List the users",
    tags: ["users"],
  }),
  (c) => {
    const role = Role.safeParse(c.req.query("role"));
    return c.json(listUsers(role.success ? role.data : undefined));
  }
);
