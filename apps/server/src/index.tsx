// src/index.tsx — the office site

import { readdir } from "node:fs/promises";
import { serveStatic } from "@hono/bun";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { openAPIRouteHandler } from "hono-openapi";
import { authApi } from "./auth";
import { buildingsApi } from "./buildings";
import { team } from "./data";
import { entrancesApi } from "./entrances";
import { etaPages } from "./eta-pages";
import { problem } from "./problem";
import { routesApi } from "./routes";
import { stringPages } from "./string-pages";
import { surveysApi } from "./surveys";
import { usersApi } from "./users";
import { Layout } from "./views/Layout";

interface Env {
  Variables: { requestId: string };
}
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

app.use("/api/*", cors({ credentials: true, origin: "http://localhost:5173" }));

app.use("*", serveStatic({ root: "./public" }));

app.get("/", (c) => {
  const name = c.req.query("name") ?? "stranger";
  return c.html(
    <Layout title="Home">
      <h1>Hello, {name}!</h1>
      <p>The office side of the building survey.</p>
    </Layout>
  );
});

app.get("/team", (c) =>
  c.html(
    <Layout title="Team">
      <h1>Team</h1>
      <ul>
        {team.map((member) => (
          <li key={member}>{member}</li>
        ))}
      </ul>
    </Layout>
  )
);
app.get("/echo", (c) => c.json({ hello: c.req.query("name") ?? "stranger" }));
app.post("/echo", async (c) => {
  const body = await c.req.text();
  return c.json({ contentType: c.req.header("content-type"), youSent: body });
});
app.get("/time", (c) => {
  c.header("Cache-Control", "no-store");
  return c.json({ now: new Date().toISOString() });
});

// step 3: responses by hand
app.get("/api/status", (c) =>
  c.json({
    ok: true,
    requestId: c.get("requestId"),
    uptime: Math.round(process.uptime()),
  })
);
app.get("/hello", (c) =>
  c.html(`<h1>Hello, ${c.req.query("name") ?? "stranger"}!</h1>`)
);
app.get("/teapot", (c) => {
  c.header("X-Brewed-By", "Hono");
  return c.text("I'm a teapot\n", 418);
});
app.get("/home", (c) => c.redirect("/"));

// step 4: pages from strings
app.route("/strings", stringPages);

// step 5: pages from an engine
app.route("/eta", etaPages);

app.get("/files", async (c) => {
  const names = await readdir("./public");
  const files = names.map((name) => ({
    name,
    size: Bun.file(`./public/${name}`).size,
  }));
  return c.html(
    <Layout title="Files">
      <h1>public/</h1>
      <ul>
        {files.map((file) => (
          <li key={file.name}>
            <a href={`/${file.name}`}>{file.name}</a> — {file.size} bytes
          </li>
        ))}
      </ul>
    </Layout>
  );
});
app.get("/about", (c) =>
  c.html(
    <Layout title="About">
      <h1>About</h1>
      <p>
        The office site plans building surveys, assigns them and reads what the
        field app sends back.
      </p>
    </Layout>
  )
);

// under /api/ a problem+json; everywhere else the HTML page
app.notFound((c) =>
  c.req.path.startsWith("/api/")
    ? problem(c, 404, `No route at ${c.req.method} ${c.req.path}`)
    : c.html(
        <Layout title="Not found">
          <h1>404 — nothing here</h1>
          <p>
            No page at <code>{c.req.path}</code>. <a href="/">Back home</a>
          </p>
        </Layout>,
        404
      )
);

app.onError((err, c) => {
  console.error(`[${c.get("requestId")}]`, err.message);
  // the client gets the request id, never the error's message
  if (c.req.path.startsWith("/api/")) {
    return problem(
      c,
      500,
      `Request ${c.get("requestId")} failed. It has been logged.`
    );
  }
  return c.html(
    <Layout title="Error">
      <h1>Something broke</h1>
      <p>Request {c.get("requestId")} failed. It has been logged.</p>
    </Layout>,
    500
  );
});

app.get("/boom", () => {
  throw new Error("Boom: a test error");
});

app.route("/api/auth", authApi);
app.route("/api/buildings", buildingsApi);
app.route("/api/entrances", entrancesApi);
app.route("/api/surveys", surveysApi);
app.route("/api/users", usersApi);
app.route("/api/routes", routesApi);

// the OpenAPI document, written from every describeRoute above, and a page that reads it
app.get(
  "/api/openapi.json",
  openAPIRouteHandler(app, {
    documentation: {
      components: {
        securitySchemes: {
          session: { in: "cookie", name: "session", type: "apiKey" },
        },
      },
      info: { title: "The office API", version: "1.0.0" },
      // every operation wants the cookie, but those that say security: []
      security: [{ session: [] }],
    },
  })
);
app.get("/api/docs", Scalar({ url: "/api/openapi.json" }));

export default app;
