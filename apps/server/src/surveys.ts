// apps/server/src/surveys.ts — the surveys API; the SQL lives in src/db/
import { fieldErrors, NewSurvey, PageQuery } from "@office/shared";
import { Hono } from "hono";
import { isForeignKeyError } from "./db/errors";
import { createSurvey, listSurveys } from "./db/surveys";
import { problem } from "./problem";

export const surveysApi = new Hono();

// GET /api/surveys?entranceId=<id>&limit=10&offset=0: one entrance's surveys, a page
surveysApi.get("/", (c) => {
  const page = PageQuery.safeParse(c.req.query());
  if (!page.success) {
    return problem(c, 400, "limit is 1 to 100, offset 0 or more", {
      errors: fieldErrors(page.error),
    });
  }
  return c.json(listSurveys(page.data, c.req.query("entranceId")));
});

surveysApi.post("/", async (c) => {
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
});
