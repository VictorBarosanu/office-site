// src/eta-pages.ts — the same pages with a template engine
import path from "node:path";
import { Eta } from "eta";
import { Hono } from "hono";
import { team } from "./data";

const eta = new Eta({ views: path.join(import.meta.dirname, "..", "views") });

export const etaPages = new Hono();

etaPages.get("/", (c) => {
  const name = c.req.query("name") ?? "stranger";
  return c.html(eta.render("./home", { name, title: "Home" }));
});

etaPages.get("/team", (c) =>
  c.html(eta.render("./team", { team, title: "Team" }))
);
