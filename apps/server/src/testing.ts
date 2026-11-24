// apps/server/src/testing.ts — helpers shared by the test files
import { db } from "./db";
import { users } from "./db/schema";
import app from "./index";

export const PASSWORD = "dev-password";
export const IRINA = "irina.matei@example.com";
export const ANDREI = "andrei.ionescu@example.com";
export const MARIA = "maria.stan@example.com";

export const postJson = (body: unknown): RequestInit => ({
  body: JSON.stringify(body),
  headers: { "Content-Type": "application/json" },
  method: "POST",
});

// the seed leaves every user unverified (real addresses don't exist in dev);
// tests that don't care about the inbox call this after seed()
export async function verifyEveryone() {
  await db.update(users).set({ emailVerified: true });
}

// Better Auth's sign-in: POST /api/auth/sign-in/email
export const signIn = (email: string, password = PASSWORD) =>
  app.request("/api/auth/sign-in/email", postJson({ email, password }));

// the "name=value" parts of every Set-Cookie, which Cookie carries back
export const cookieOf = (res: Response) =>
  res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0] ?? "")
    .filter(Boolean)
    .join("; ");

// app.request() with one user's cookie on every call
export const as =
  (cookie: string) =>
  (path: string, init: RequestInit = {}) =>
    app.request(path, {
      ...init,
      headers: { ...init.headers, Cookie: cookie },
    });
