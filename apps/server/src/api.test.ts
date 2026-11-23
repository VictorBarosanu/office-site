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
  seed("test-only-password");
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
    "/api/auth/me",
    "/api/auth/sign-in",
    "/api/buildings",
    "/api/buildings/search",
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

const search = (q: string) =>
  getPage(`/api/buildings/search?q=${encodeURIComponent(q)}`);

test("the search finds a building by a word of its label or its comment", async () => {
  const byLabel = await search("lipscani");
  expect(byLabel.total).toBe(1);
  expect(byLabel.items[0]).toMatchObject({ label: "Lipscani 41" });
  // a prefix, and no diacritics: "france" finds "Franceză 28"
  expect((await search("france")).items[0]).toMatchObject({
    label: "Franceză 28",
  });
  expect((await search("courtyard")).total).toBe(1);
});

test("a miss is an empty page, and FTS5 syntax is only text", async () => {
  expect(await search("zzz")).toMatchObject({ items: [], total: 0 });
  expect((await search('" OR * AND (')).total).toBe(0);
  expect((await search("!!!")).total).toBe(0);
  const empty = await app.request("/api/buildings/search?q=");
  expect(empty.status).toBe(400);
});

test("a new building is found at once: the trigger indexed it", async () => {
  await app.request("/api/buildings", {
    body: JSON.stringify({ comment: "Behind the market", label: "Obor 3" }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  expect((await search("market")).items[0]).toMatchObject({ label: "Obor 3" });
});

test("buildings with the same score keep one order, so pages never repeat or skip", async () => {
  await Promise.all(
    [1, 2, 3].map(() =>
      app.request("/api/buildings", {
        body: JSON.stringify({ comment: "Quokka", label: "Quokka" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
    )
  );
  const one = async (offset: number) =>
    (await getPage(`/api/buildings/search?q=quokka&limit=1&offset=${offset}`))
      .items[0]?.id ?? "";
  const ids = [await one(0), await one(1), await one(2)];
  expect(new Set(ids).size).toBe(3);
  expect(ids).toEqual([...ids].sort());
});
