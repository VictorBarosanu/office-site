// apps/server/src/testing.ts — what the tests share: a password, the fixture users, signing in
import app from "./index";

export const PASSWORD = "test-only-password"; // the seed's, for the :memory: database only
export const IRINA = "irina.matei@example.com"; // the admin
export const ANDREI = "andrei.ionescu@example.com"; // a field worker
export const MARIA = "maria.stan@example.com"; // another field worker

// app.request() has no Bun server behind it: this stands in for the one that knows the IP
const server = { requestIP: () => ({ address: "127.0.0.1" }) };

export const signIn = (email: string, password = PASSWORD) =>
  app.request(
    "/api/auth/sign-in",
    {
      body: JSON.stringify({ email, password }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    server
  );

// the browser's part: the cookie the server set, ready to send back
export const cookieOf = (res: Response) =>
  (res.headers.get("set-cookie") ?? "").split(";")[0] ?? "";

// a request as this user: their cookie on it
export const as =
  (cookie: string) =>
  (path: string, init: RequestInit = {}) =>
    app.request(path, {
      ...init,
      headers: { ...init.headers, Cookie: cookie },
    });

export const postJson = (body: unknown): RequestInit => ({
  body: JSON.stringify(body),
  headers: { "Content-Type": "application/json" },
  method: "POST",
});
