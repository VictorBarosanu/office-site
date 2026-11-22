// apps/server/src/problem.ts — one error shape for every 4xx and 5xx: RFC 9457, application/problem+json
import type { Context } from "hono";

// the status codes this API answers with, and the name RFC 9110 gives each one
const TITLES = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  500: "Internal Server Error",
} as const;

// "about:blank": nothing to know beyond the status code, so the title is its name
export function problem(
  c: Context,
  status: keyof typeof TITLES,
  detail: string,
  extensions: Record<string, unknown> = {}
) {
  return c.json(
    {
      detail,
      instance: c.req.path,
      status,
      title: TITLES[status],
      type: "about:blank",
      ...extensions,
    },
    status,
    { "Content-Type": "application/problem+json" }
  );
}
