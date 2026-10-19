// src/index.tsx — the office site
import { Hono } from "hono";
import { logger } from "hono/logger";

import { stringPages } from "./string-pages";

import { team } from "./data";
import { Layout } from "./views/Layout";

import { etaPages } from "./eta-pages";

import { serveStatic } from "@hono/bun";

import { readdir } from "node:fs/promises";
import { entrancesApi } from "./entrances";

type Env = { Variables: { requestId: string } };
const app = new Hono<Env>();
app.use(logger());

app.use(async (c, next) => {
  const started = performance.now();
  c.set("requestId", crypto.randomUUID().slice(0, 8));
  await next();
  const ms = (performance.now() - started).toFixed(1);
  c.header("X-Request-Id", c.get("requestId"));
  c.header("X-Response-Time", `${ms}ms`);
});

app.use("*", serveStatic({ root: "./public" }));

app.get("/", (c) => {
  const name = c.req.query("name") ?? "stranger";
  return c.html(
    <Layout title="Home">
      <h1>Hello, {name}!</h1>
      <p>The office side of the building survey.</p>
    </Layout>,
  );
});

app.get("/team", (c) =>
  c.html(
    <Layout title="Team">
      <h1>Team</h1>
      <ul>
        {team.map((member) => (
          <li>{member}</li>
        ))}
      </ul>
    </Layout>,
  ),
);
app.get("/echo", (c) => c.json({ hello: c.req.query("name") ?? "stranger" }));
app.post("/echo", async (c) => {
  const body = await c.req.text();
  return c.json({ youSent: body, contentType: c.req.header("content-type") });
});
app.get("/time", (c) => {
  c.header("Cache-Control", "no-store");
  return c.json({ now: new Date().toISOString() });
});

// step 3: responses by hand
app.get("/api/status", (c) =>
  c.json({ ok: true, uptime: Math.round(process.uptime()), requestId: c.get("requestId") }),
);
app.get("/hello", (c) => c.html(`<h1>Hello, ${c.req.query("name") ?? "stranger"}!</h1>`));
app.get("/teapot", (c) => {
  c.header("X-Brewed-By", "Hono");
  return c.text("I'm a teapot\n", 418);
});
app.get("/home", (c) => c.redirect("/"));

app.route("/api/entrances", entrancesApi);

// step 4: pages from strings
app.route("/strings", stringPages);

// step 5: pages from an engine
app.route("/eta", etaPages);

app.get("/files", async (c) => {
  const names = await readdir("./public");
  const files = names.map((name) => ({ name, size: Bun.file(`./public/${name}`).size }));
  return c.html(
    <Layout title="Files">
      <h1>public/</h1>
      <ul>
        {files.map((file) => (
          <li>
            <a href={`/${file.name}`}>{file.name}</a> — {file.size} bytes
          </li>
        ))}
      </ul>
    </Layout>,
  );
});
app.get("/about", (c) =>
  c.html(
    <Layout title="About">
      <h1>About</h1>
      <p>The office site plans building surveys, assigns them and reads what the field app sends back.</p>
    </Layout>,
  ),
);

app.notFound((c) =>
  c.html(
    <Layout title="Not found">
      <h1>404 — nothing here</h1>
      <p>
        No page at <code>{c.req.path}</code>. <a href="/">Back home</a>
      </p>
    </Layout>,
    404,
  ),
);

app.onError((err, c) => {
  console.error(`[${c.get("requestId")}]`, err.message);
  return c.html(
    <Layout title="Error">
      <h1>Something broke</h1>
      <p>Request {c.get("requestId")} failed. It has been logged.</p>
    </Layout>,
    500,
  );
});

app.get("/boom", () => {
  throw new Error("Boom: a test error");
});

export default app;