// hono.ts — the same server with a framework
import { Hono } from "hono";
import { logger } from "hono/logger";

const app = new Hono();
app.use(logger()); // one line: every request logged with status and time

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
app.notFound((c) => c.json({ error: "Not found", path: c.req.path }, 404));

export default app; // Bun sees a default export with fetch() and serves it