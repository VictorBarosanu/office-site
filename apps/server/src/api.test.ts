// apps/server/src/api.test.ts — the HTTP API end to end: app.request() needs no server and no port
import { beforeAll, expect, test } from "bun:test";
import type { Page } from "@office/shared";
import { migrate } from "../scripts/migrate";
import { seed } from "../scripts/seed";
import { db } from "./db";
import app from "./index";

// what every 4xx and 5xx carries (RFC 9457); a 400 adds the field messages
interface Problem {
  detail: string;
  errors?: Record<string, string[]>;
  instance: string;
  status: number;
  title: string;
  type: string;
}

const getPage = async (path: string) =>
  (await (await app.request(path)).json()) as Page<{ id: string }>;

beforeAll(() => {
  if (db.$client.filename !== ":memory:") {
    throw new Error(`Refusing to test on ${db.$client.filename}`);
  }
  migrate();
  seed();
});

test("a 404 is a problem+json: type, title, status, detail, instance", async () => {
  const id = crypto.randomUUID();
  const res = await app.request(`/api/entrances/${id}`);
  expect(res.status).toBe(404);
  expect(res.headers.get("content-type")).toStartWith(
    "application/problem+json"
  );
  expect(await res.json()).toEqual({
    detail: "No such entrance",
    instance: `/api/entrances/${id}`,
    status: 404,
    title: "Not Found",
    type: "about:blank",
  });
});

test("an unknown /api path is a problem+json too", async () => {
  const res = await app.request("/api/nothing-here");
  expect(res.status).toBe(404);
  expect(((await res.json()) as Problem).title).toBe("Not Found");
});

test("a 400 keeps the field messages as the extension member errors", async () => {
  const res = await app.request("/api/buildings", {
    body: JSON.stringify({ label: "" }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  expect(res.status).toBe(400);
  const body = (await res.json()) as Problem;
  expect(body).toMatchObject({ status: 400, title: "Bad Request" });
  expect(body.errors?.label).toBeArray();
});

test("a page of entrances: the items asked for, and the total of all of them", async () => {
  const first = await getPage("/api/entrances?limit=5");
  expect(first).toMatchObject({ limit: 5, offset: 0, total: 20 });
  expect(first.items).toHaveLength(5);
  const last = await getPage("/api/entrances?limit=5&offset=18");
  expect(last.items).toHaveLength(2);
  expect(last.total).toBe(20);
});

test("without ?limit a page is 10 entrances, and the second page is the other 10", async () => {
  const first = await getPage("/api/entrances");
  expect(first).toMatchObject({ limit: 10, offset: 0, total: 20 });
  expect(first.items).toHaveLength(10);
  const second = await getPage("/api/entrances?offset=10");
  expect(second.items).toHaveLength(10);
  expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
});

test("pages do not overlap: the order is stable", async () => {
  const ids = [
    ...(await getPage("/api/buildings?limit=2&offset=0")).items,
    ...(await getPage("/api/buildings?limit=2&offset=2")).items,
  ].map((building) => building.id);
  expect(ids).toHaveLength(4);
  expect(new Set(ids).size).toBe(4);
});

test("the defaults are limit 10, offset 0; a bad limit is a 400", async () => {
  expect(await getPage("/api/surveys")).toEqual({
    items: [],
    limit: 10,
    offset: 0,
    total: 0,
  });
  const bad = await app.request("/api/buildings?limit=1000");
  expect(bad.status).toBe(400);
  expect(((await bad.json()) as Problem).errors?.limit).toBeArray();
});

test("the OpenAPI document describes every API path", async () => {
  const res = await app.request("/api/openapi.json");
  expect(res.status).toBe(200);
  const doc = (await res.json()) as {
    openapi: string;
    paths: Record<string, Record<string, unknown>>;
  };
  expect(doc.openapi).toStartWith("3.");
  expect(Object.keys(doc.paths).sort()).toEqual([
    "/api/buildings",
    "/api/buildings/{id}",
    "/api/entrances",
    "/api/entrances/{id}",
    "/api/routes",
    "/api/surveys",
    "/api/users",
  ]);
  expect(doc.paths["/api/buildings"]).toContainAllKeys(["get", "post"]);
});

test("the document says what the code does: a page is 10 items by default", async () => {
  const doc = await (await app.request("/api/openapi.json")).text();
  expect(doc).toContain('"default":10');
  expect(doc).not.toContain('"default":20');
});

test("the docs page is an HTML page that reads the document", async () => {
  const res = await app.request("/api/docs");
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toStartWith("text/html");
  expect(await res.text()).toContain("/api/openapi.json");
});
