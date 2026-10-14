// src/string-pages.ts — pages built from strings, by hand
import { Hono } from "hono";
import { team } from "./data";

export function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${title} · Office site</title>
  </head>
  <body>
    <nav><a href="/strings">Home</a> · <a href="/strings/team">Team</a></nav>
    ${body}
  </body>
</html>`;
}

export const stringPages = new Hono();

stringPages.get("/", (c) => {
  const name = c.req.query("name") ?? "stranger";
  return c.html(layout("Home", `<h1>Hello, ${name}!</h1>`));
});

stringPages.get("/team", (c) => {
  const items = team.map((member) => `<li>${member}</li>`).join("");
  return c.html(layout("Team", `<h1>Team</h1><ul>${items}</ul>`));
});