// apps/server/src/users.ts — the users API; the SQL lives in src/db/

import { fieldErrors, NewUser } from "@office/shared";
import { Role, User } from "field-app-contract/contract";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { isUniqueError } from "./db/errors";
import { createUser, listUsers } from "./db/users";
import { requireRole, requireUser, type SignedIn } from "./guards";
import { json, jsonBody, problemJson } from "./openapi";
import { problem } from "./problem";

export const usersApi = new Hono<SignedIn>();

usersApi.use(requireUser);

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

// no sign-up: an admin adds a user, with a first password (week 8 sends an invitation)
usersApi.post(
  "/",
  requireRole("admin"),
  describeRoute({
    requestBody: jsonBody(NewUser),
    responses: {
      201: json("The user, without the password", User),
      400: problemJson("Not a valid user"),
      409: problemJson("The email is taken"),
    },
    summary: "Add a user",
    tags: ["users"],
  }),
  async (c) => {
    const result = NewUser.safeParse(await c.req.json().catch(() => null));
    if (!result.success) {
      return problem(c, 400, "The user is not valid", {
        errors: fieldErrors(result.error),
      });
    }
    const hash = await Bun.password.hash(result.data.password);
    try {
      return c.json(createUser(result.data, hash), 201);
    } catch (error) {
      if (isUniqueError(error)) {
        return problem(c, 409, "The email is taken", {
          errors: { email: ["Someone already has this email"] },
        });
      }
      throw error;
    }
  }
);
