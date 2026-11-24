// apps/server/src/auth.test.ts — signing in and out through Better Auth, end to end with app.request()
import { beforeAll, expect, test } from "bun:test";
import { eq, sql } from "drizzle-orm";
import { migrate } from "../scripts/migrate";
import { seed } from "../scripts/seed";
import { db } from "./db";
import { account, users } from "./db/schema";
import app from "./index";
import {
  ANDREI,
  as,
  cookieOf,
  IRINA,
  PASSWORD,
  postJson,
  signIn,
} from "./testing";

// better-auth.session_token=<token>.<signature>; then the attributes
const SESSION_COOKIE = /^better-auth\.session_token=[^;]+; /;

// a hash week 7's sign-in wrote (Bun.password.hashSync("test-only-password")), byte for byte
const WEEK_7_HASH =
  "$argon2id$v=19$m=65536,t=2,p=1$I5lcrETlbCX1YickK4oUSXBOn09vErdax1O532zBtwg$7CR97dEw/7aNMSbT3ckCtQHiCvZz5hBvUkI4FmBffUs";

const sessionOf = async (cookie: string) =>
  (await (await as(cookie)("/api/auth/get-session")).json()) as {
    user: { email: string; role: string };
  } | null;

beforeAll(async () => {
  await migrate();
  await seed(PASSWORD);
});

test("the seed refuses to run without a password", async () => {
  await expect(seed(undefined)).rejects.toThrow("SEED_PASSWORD");
});

test("the seed stores a hash, never the password", async () => {
  const { rows } = await db.execute<{ password: string }>(
    sql`SELECT password FROM account WHERE provider_id = 'credential' LIMIT 1`
  );
  const password = rows[0]?.password ?? "";
  expect(password).toStartWith("$argon2id$");
  expect(password).not.toContain(PASSWORD);
});

test("the right password signs in: Better Auth's HttpOnly, SameSite=Lax cookie and the user", async () => {
  const res = await signIn(IRINA);
  expect(res.status).toBe(200);
  const body = (await res.json()) as { user: { role: string } };
  expect(body.user.role).toBe("admin");
  const cookie = res.headers.get("set-cookie") ?? "";
  expect(cookie).toMatch(SESSION_COOKIE);
  expect(cookie).toContain("HttpOnly");
  expect(cookie).toContain("SameSite=Lax");
  expect(cookie).not.toContain("Secure"); // only on https: localhost is http
  expect((await sessionOf(cookieOf(res)))?.user.email).toBe(IRINA);
});

test("a hash week 7 wrote signs in unchanged: Bun.password verifies it", async () => {
  const [andrei] = await db.select().from(users).where(eq(users.email, ANDREI));
  await db
    .update(account)
    .set({ password: WEEK_7_HASH })
    .where(eq(account.userId, andrei?.id ?? ""));
  const res = await signIn(ANDREI, "test-only-password");
  expect(res.status).toBe(200);
});

test("the email's case does not matter", async () => {
  const res = await signIn(IRINA.toUpperCase());
  expect(res.status).toBe(200);
});

test("a wrong password is a 401, and so is an unknown email, word for word", async () => {
  const wrong = await signIn(IRINA, "not-the-password");
  const unknown = await signIn("nobody@example.com");
  expect(wrong.status).toBe(401);
  expect(unknown.status).toBe(401);
  // the same answer: nobody learns which emails have an account
  expect(await wrong.json()).toEqual(await unknown.json());
  expect(wrong.headers.get("set-cookie")).toBeNull();
});

test("no cookie, or a made-up one, is nobody: no session, and the API answers 401", async () => {
  expect(await sessionOf("")).toBeNull();
  const madeUp = "better-auth.session_token=made-up";
  expect(await sessionOf(madeUp)).toBeNull();
  expect((await as(madeUp)("/api/buildings")).status).toBe(401);
});

test("sign-out deletes the session: the same cookie opens nothing after", async () => {
  const cookie = cookieOf(await signIn(IRINA));
  expect((await as(cookie)("/api/buildings")).status).toBe(200);
  const out = await as(cookie)("/api/auth/sign-out", postJson({}));
  expect(out.status).toBe(200);
  expect(out.headers.get("set-cookie")).toContain("Max-Age=0");
  // a copy of the cookie kept from before is worth nothing now
  expect(await sessionOf(cookie)).toBeNull();
  expect((await as(cookie)("/api/buildings")).status).toBe(401);
});

test("there is no sign-up: an admin adds people", async () => {
  const res = await app.request(
    "/api/auth/sign-up/email",
    postJson({ email: "me@example.com", name: "Me", password: "my-password" })
  );
  expect(res.status).toBe(400);
});
