// apps/server/src/surveys.ts — the surveys API; the SQL lives in src/db/
import { fieldErrors, NewSurvey, PageQuery, Survey } from "@office/shared";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { isForeignKeyError } from "./db/errors";
import { createSurvey, listSurveys } from "./db/surveys";
import { requireRole, requireUser, type SignedIn } from "./guards";
import {
  json,
  jsonBody,
  pageJson,
  pageParameters,
  problemJson,
} from "./openapi";
import { problem } from "./problem";

export const surveysApi = new Hono<SignedIn>();

// every route below: signed-in users only (401 otherwise)
surveysApi.use(requireUser);

// GET /api/surveys?entranceId=<id>&limit=10&offset=0: one entrance's surveys, a page
surveysApi.get(
  "/",
  describeRoute({
    parameters: [
      ...(pageParameters ?? []),
      {
        in: "query",
        name: "entranceId",
        schema: { format: "uuid", type: "string" },
      },
    ],
    responses: {
      200: pageJson("One page of surveys, oldest first", Survey),
      400: problemJson("A bad limit or offset"),
    },
    summary: "List the surveys",
    tags: ["surveys"],
  }),
  (c) => {
    const page = PageQuery.safeParse(c.req.query());
    if (!page.success) {
      return problem(c, 400, "limit is 1 to 100, offset 0 or more", {
        errors: fieldErrors(page.error),
      });
    }
    return c.json(listSurveys(page.data, c.req.query("entranceId")));
  }
);

surveysApi.post(
  "/",
  requireRole("admin"),
  describeRoute({
    requestBody: jsonBody(NewSurvey),
    responses: {
      201: json("The survey, with its id", Survey),
      400: problemJson("Not a valid survey, or no such entrance"),
    },
    summary: "Record a survey",
    tags: ["surveys"],
  }),
  async (c) => {
    const result = NewSurvey.safeParse(await c.req.json().catch(() => null));
    if (!result.success) {
      return problem(c, 400, "The survey is not valid", {
        errors: fieldErrors(result.error),
      });
    }
    try {
      return c.json(createSurvey(result.data), 201);
    } catch (error) {
      if (isForeignKeyError(error)) {
        return problem(c, 400, "The survey is not valid", {
          errors: { entranceId: ["No such entrance"] },
        });
      }
      throw error;
    }
  }
);
