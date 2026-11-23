// apps/server/src/roles.test.ts — who may do what: 401 signed out, 403 the wrong role, 404 not yours
import { beforeAll, expect, test } from "bun:test";
import { migrate } from "../scripts/migrate";
import { seed } from "../scripts/seed";
import { db } from "./db";
import app from "./index";
import {
  ANDREI,
  as,
  cookieOf,
  IRINA,
  MARIA,
  PASSWORD,
  postJson,
  signIn,
} from "./testing";

const ANDREIS_ROUTE = "f6f2d1fd-0221-48d5-8fb8-bc54c9100830"; // a fixture
const MARIAS_ROUTE = "9e65acb1-4bf7-48c8-a3da-9dc14941cf38"; // a fixture
let admin: ReturnType<typeof as>;
let andrei: ReturnType<typeof as>;

beforeAll(async () => {
  if (db.$client.filename !== ":memory:") {
    throw new Error(`Refusing to test on ${db.$client.filename}`);
  }
  migrate();
  seed(PASSWORD);
  admin = as(cookieOf(await signIn(IRINA)));
  andrei = as(cookieOf(await signIn(ANDREI)));
});

test("signed out, the API answers 401; sign-in and the docs stay open", async () => {
  expect((await app.request("/api/buildings")).status).toBe(401);
  expect((await app.request("/api/routes")).status).toBe(401);
  expect((await app.request("/api/openapi.json")).status).toBe(200);
  expect((await app.request("/api/docs")).status).toBe(200);
});

test("a field worker reads the lists", async () => {
  expect((await andrei("/api/buildings")).status).toBe(200);
  expect((await andrei("/api/entrances")).status).toBe(200);
  expect((await andrei("/api/users?role=field")).status).toBe(200);
});

test("a field worker's write is a 403", async () => {
  const res = await andrei("/api/buildings", postJson({ label: "Nope 1" }));
  expect(res.status).toBe(403);
  expect(await res.json()).toMatchObject({ status: 403, title: "Forbidden" });
  expect(
    (
      await andrei(`/api/buildings/${crypto.randomUUID()}`, {
        method: "DELETE",
      })
    ).status
  ).toBe(403);
});

test("a field worker lists only their own routes", async () => {
  const routes = (await (await andrei("/api/routes")).json()) as {
    id: string;
  }[];
  expect(routes.map((r) => r.id)).toEqual([ANDREIS_ROUTE]);
  expect((await (await admin("/api/routes")).json()) as unknown[]).toHaveLength(
    2
  );
});

test("another worker's route is a 404 for a field worker, as if it were not there", async () => {
  expect((await andrei(`/api/routes/${ANDREIS_ROUTE}`)).status).toBe(200);
  const res = await andrei(`/api/routes/${MARIAS_ROUTE}`);
  expect(res.status).toBe(404);
  expect(await res.json()).toMatchObject({ detail: "No such route" });
  expect((await admin(`/api/routes/${MARIAS_ROUTE}`)).status).toBe(200);
});

test("a route is assigned by the admin who is signed in", async () => {
  const created = (await (
    await admin(
      "/api/routes",
      postJson({
        date: "2026-11-18",
        entranceIds: ["2511ddfb-2828-46f5-b23c-39501d862310"],
        name: "Lab route",
        workerId: "e1d1772a-48c0-4cb7-be24-ed343b29d9a1",
      })
    )
  ).json()) as { adminId: string };
  expect(created.adminId).toBe("7d07e973-eebc-44b1-b7cd-bd1cd2fff3c5");
});

test("only an admin adds a user, who can then sign in", async () => {
  const user = {
    email: "new.worker@example.com",
    name: "New Worker",
    password: "a-first-password",
    role: "field",
  };
  expect((await andrei("/api/users", postJson(user))).status).toBe(403);
  const res = await admin("/api/users", postJson(user));
  expect(res.status).toBe(201);
  expect(await res.json()).not.toHaveProperty("password");
  expect((await signIn(user.email, user.password)).status).toBe(200);
  // the email is taken now
  expect((await admin("/api/users", postJson(user))).status).toBe(409);
});

test("a new user's email is stored lowercase, so one address is one account", async () => {
  const user = {
    email: "  Mixed.Case@Example.com ",
    name: "Mixed Case",
    password: "a-first-password",
    role: "field",
  };
  const res = await admin("/api/users", postJson(user));
  expect(res.status).toBe(201);
  expect(((await res.json()) as { email: string }).email).toBe(
    "mixed.case@example.com"
  );
  expect((await signIn("mixed.case@example.com", user.password)).status).toBe(
    200
  );
  // the same address in other letters is the same account
  const again = { ...user, email: "MIXED.CASE@example.com" };
  expect((await admin("/api/users", postJson(again))).status).toBe(409);
});

test("Maria, also field, sees her route and not Andrei's", async () => {
  const maria = as(cookieOf(await signIn(MARIA)));
  expect((await maria(`/api/routes/${ANDREIS_ROUTE}`)).status).toBe(404);
  expect((await maria(`/api/routes/${MARIAS_ROUTE}`)).status).toBe(200);
});
