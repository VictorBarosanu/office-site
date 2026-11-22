// apps/server/src/openapi.ts — the pieces every describeRoute repeats: a JSON body, a problem, a page
import { Problem, pageOf } from "@office/shared";
import { type DescribeRouteOptions, resolver } from "hono-openapi";

// any zod schema (any Standard Schema): resolver turns it into JSON Schema
type Schema = Parameters<typeof resolver>[0];

// a response with a JSON body of this schema
export const json = (description: string, schema: Schema) => ({
  content: { "application/json": { schema: resolver(schema) } },
  description,
});

// a request with a JSON body of this schema, as the client sends it (defaults still optional)
export const jsonBody = (schema: Schema) => ({
  content: {
    "application/json": { schema: resolver(schema, { io: "input" }) },
  },
});

// a 4xx or 5xx: always the same shape, under its own media type
export const problemJson = (description: string) => ({
  content: { "application/problem+json": { schema: resolver(Problem) } },
  description,
});

// a 200 with one page of these
export const pageJson = (
  description: string,
  item: Parameters<typeof pageOf>[0]
) => json(description, pageOf(item));

// ?limit&offset, written as OpenAPI says a query parameter is written
export const pageParameters: DescribeRouteOptions["parameters"] = [
  {
    in: "query",
    name: "limit",
    schema: { default: 10, maximum: 100, minimum: 1, type: "integer" },
  },
  {
    in: "query",
    name: "offset",
    schema: { default: 0, minimum: 0, type: "integer" },
  },
];
