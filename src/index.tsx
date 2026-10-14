// src/index.tsx — the office site
import { Hono } from "hono";
import { logger } from "hono/logger";

import { stringPages } from "./string-pages";

// step 4: pages from strings

const app = new Hono();
app.use(logger());

app.route("/strings", stringPages);
app.get("/", (c) => {
  c.header("X-Course", "advanced-web");
  return c.text("Hello from Hono!\n");
});
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