// apps/server/src/auth.test.ts — signing in, end to end through app.request()
import { beforeAll, expect, test } from "bun:test";
import { migrate } from "../scripts/migrate";
import { seed } from "../scripts/seed";
import { db } from "./db";
import app from "./index";

const PASSWORD = "test-only-password"; // the seed's, for this :memory: database only
const IRINA = "irina.matei@example.com"; // the admin, a fixture

const signIn = (email: string, password: string) =>
  app.request("/api/auth/sign-in", {
    body: JSON.stringify({ email, password }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

beforeAll(() => {
  if (db.$client.filename !== ":memory:") {
    throw new Error(`Refusing to test on ${db.$client.filename}`);
  }
  migrate();
  seed(PASSWORD);
});

test("the seed refuses to run without a password", () => {
  expect(() => seed(undefined)).toThrow("SEED_PASSWORD");
});

test("the seed stores a hash, never the password", () => {
  const { password } = db.$client
    .query<{ password: string }, []>(
      "SELECT password FROM account WHERE provider_id = 'credential' LIMIT 1"
    )
    .get() ?? { password: "" };
  expect(password).toStartWith("$argon2id$");
  expect(password).not.toContain(PASSWORD);
});

test("the right password signs in: a token and the user", async () => {
  const res = await signIn(IRINA, PASSWORD);
  expect(res.status).toBe(200);
  const body = (await res.json()) as { token: string; user: { role: string } };
  expect(body.token.length).toBeGreaterThanOrEqual(43); // 32 random bytes
  expect(body.user.role).toBe("admin");
  const me = await app.request("/api/auth/me", {
    headers: { Authorization: `Bearer ${body.token}` },
  });
  expect(me.status).toBe(200);
});

test("the email's case and spaces do not matter", async () => {
  const res = await signIn(` ${IRINA.toUpperCase()} `, PASSWORD);
  expect(res.status).toBe(200);
  expect(((await res.json()) as { user: { email: string } }).user.email).toBe(
    IRINA
  );
});

test("a wrong password is a 401, and so is an unknown email, word for word", async () => {
  const wrong = await signIn(IRINA, "not-the-password");
  expect(wrong.status).toBe(401);
  const unknown = await signIn("nobody@example.com", PASSWORD);
  expect(unknown.status).toBe(401);
  // the same answer: nobody learns which emails have an account
  const { instance: _a, ...wrongBody } = (await wrong.json()) as object & {
    instance: string;
  };
  const { instance: _b, ...unknownBody } = (await unknown.json()) as object & {
    instance: string;
  };
  expect(wrongBody).toEqual(unknownBody);
});

test("no token, or a made-up one, is a 401", async () => {
  expect((await app.request("/api/auth/me")).status).toBe(401);
  const madeUp = await app.request("/api/auth/me", {
    headers: { Authorization: "Bearer made-up" },
  });
  expect(madeUp.status).toBe(401);
});
