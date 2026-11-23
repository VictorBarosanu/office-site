// apps/server/src/auth.ts — sign-in by hand: Bun.password, and a session token
import { fieldErrors, SignIn, SignInAnswer } from "@office/shared";
import { User } from "field-app-contract/contract";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { findCredential, getUser } from "./db/auth";
import { json, jsonBody, problemJson } from "./openapi";
import { problem } from "./problem";

export const authApi = new Hono();

// token → user id; in memory, so a restart signs everybody out (step 5 fixes that)
const sessions = new Map<string, string>();

// 32 random bytes from the operating system's generator, as URL-safe text
const newToken = () =>
  Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");

// checked when the email is unknown, so a wrong email takes as long as a wrong password
const NO_SUCH_USER = Bun.password.hashSync(newToken());

authApi.post(
  "/sign-in",
  describeRoute({
    requestBody: jsonBody(SignIn),
    responses: {
      200: json("Signed in: the token and the user", SignInAnswer),
      400: problemJson("Not an email, or no password"),
      401: problemJson("Wrong email or password"),
    },
    summary: "Sign in with an email and a password",
    tags: ["auth"],
  }),
  async (c) => {
    const result = SignIn.safeParse(await c.req.json().catch(() => null));
    if (!result.success) {
      return problem(c, 400, "Type an email and a password", {
        errors: fieldErrors(result.error),
      });
    }
    const { email, password } = result.data;
    const found = findCredential(email);
    const ok = await Bun.password.verify(password, found?.hash ?? NO_SUCH_USER);
    // one answer for both mistakes: nobody learns which emails have an account
    if (!(ok && found)) {
      return problem(c, 401, "Wrong email or password");
    }
    const token = newToken();
    sessions.set(token, found.user.id);
    return c.json({ token, user: found.user });
  }
);

// GET /api/auth/me with Authorization: Bearer <token>: who is signed in
authApi.get(
  "/me",
  describeRoute({
    responses: {
      200: json("The signed-in user", User),
      401: problemJson("Not signed in"),
    },
    summary: "Who is signed in",
    tags: ["auth"],
  }),
  (c) => {
    const header = c.req.header("Authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const userId = sessions.get(token);
    const user = userId ? getUser(userId) : undefined;
    return user ? c.json(user) : problem(c, 401, "Sign in first");
  }
);
