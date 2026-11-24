// apps/server/src/testing.ts — what the tests share: a password, the fixture users, signing in
import { WEB } from "./auth";
import app from "./index";

export const PASSWORD = "test-only-password"; // the seed's, for office_test only
export const IRINA = "irina.matei@example.com"; // the admin
export const ANDREI = "andrei.ionescu@example.com"; // a field worker
export const MARIA = "maria.stan@example.com"; // another field worker

// Better Auth's sign-in: POST /api/auth/sign-in/email
export const signIn = (email: string, password = PASSWORD) =>
  app.request("/api/auth/sign-in/email", postJson({ email, password }));

// the browser's part: every cookie the server set, ready to send back
export const cookieOf = (res: Response) =>
  res.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");

// a request as this user: their cookie on it
export const as =
  (cookie: string) =>
  (path: string, init: RequestInit = {}) =>
    app.request(path, {
      ...init,
      headers: { ...init.headers, Cookie: cookie },
    });

// Origin: the browser sends it; Better Auth refuses a cookie-carrying POST from an unknown one
export const postJson = (body: unknown): RequestInit => ({
  body: JSON.stringify(body),
  headers: { "Content-Type": "application/json", Origin: WEB },
  method: "POST",
});
