// src/index.tsx — the office site
import { Hono } from "hono";
import { logger } from "hono/logger";

import { stringPages } from "./string-pages";

import { team } from "./data";
import { Layout } from "./views/Layout";

import { etaPages } from "./eta-pages";

// step 5: pages from an engine
// step 4: pages from strings

const app = new Hono();
app.use(logger());

app.route("/eta", etaPages);
app.route("/strings", stringPages);
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
app.get("/api/status", (c) => c.json({ ok: true, uptime: Math.round(process.uptime()) }));
app.get("/hello", (c) => c.html(`<h1>Hello, ${c.req.query("name") ?? "stranger"}!</h1>`));
app.get("/teapot", (c) => {
  c.header("X-Brewed-By", "Hono");
  return c.text("I'm a teapot\n", 418);
});
app.get("/home", (c) => c.redirect("/"));

app.notFound((c) => c.json({ error: "Not found", path: c.req.path }, 404));

export default app;