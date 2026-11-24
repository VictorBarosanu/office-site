// apps/server/src/guards.ts — the two checks every protected route makes: who are you, may you
import { type Role, User } from "field-app-contract/contract";
import { createMiddleware } from "hono/factory";
import { auth } from "./auth";
import { iso } from "./db/iso";
import { problem } from "./problem";

// what a handler behind requireUser can read: c.get("user")
export interface SignedIn {
  Variables: { user: User };
}

// 401: no session, or an expired one; Better Auth reads the cookie and the session row
export const requireUser = createMiddleware<SignedIn>(async (c, next) => {
  const signedIn = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!signedIn) {
    return problem(c, 401, "Sign in first");
  }
  // Better Auth's user as the contract's: ISO timestamps, only the contract's fields
  c.set("user", User.parse(iso(signedIn.user)));
  await next();
});

// 403: signed in, but not allowed; put it after requireUser
export const requireRole = (role: Role) =>
  createMiddleware<SignedIn>(async (c, next) => {
    if (c.get("user").role !== role) {
      return problem(c, 403, `Only an ${role} can do this`);
    }
    await next();
  });
