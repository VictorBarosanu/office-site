// src/views/Layout.tsx — the page shell, as a component
import { raw } from "hono/html";
import type { PropsWithChildren } from "hono/jsx";

type LayoutProps = PropsWithChildren<{ title: string }>;

export function Layout({ title, children }: LayoutProps) {
  return (
    <>
      {raw("<!doctype html>")}
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{title} · Office site</title>
          <link rel="stylesheet" href="/style.css" />
        </head>
        <body>
          <nav>
            <img src="/logo.svg" alt="" width="24" height="24" />
            <a href="/">Home</a> · <a href="/team">Team</a>
            <a href="/">Home</a> · <a href="/team">Team</a> · <a href="/about">About</a>
          </nav>
          <main>{children}</main>
          <footer>Office site · week 2</footer>
        </body>
      </html>
    </>
  );
}