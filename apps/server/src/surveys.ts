// apps/server/src/surveys.ts — the surveys API; the SQL lives in src/db/
import { fieldErrors, NewSurvey } from "@office/shared";
import { Hono } from "hono";

import { createSurvey, deleteSurvey, listSurveys } from "./db/surveys";

export const surveysApi = new Hono();

surveysApi.get("/", (c) => {
  const entranceId = c.req.query("entranceId");
  return c.json(listSurveys(entranceId));
});

surveysApi.post("/", async (c) => {
  const result = NewSurvey.safeParse(await c.req.json().catch(() => null));
  if (!result.success) {
    return c.json({ errors: fieldErrors(result.error) }, 400);
  }
  return c.json(createSurvey(result.data), 201);
});

surveysApi.delete("/:id", (c) => {
  if (deleteSurvey(c.req.param("id")) === 0) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.body(null, 204);
});
