// apps/server/src/db/surveys.ts — the queries for surveys; routes call these functions
import type { NewSurvey, Page, PageQuery, Survey } from "@office/shared";
import { asc, count, eq } from "drizzle-orm";
import { db } from "../db";
import { surveys } from "./schema";

export function listSurveys(
  { limit, offset }: PageQuery,
  entranceId?: string
): Page<Survey> {
  const where = entranceId ? eq(surveys.entranceId, entranceId) : undefined;
  const items = db
    .select()
    .from(surveys)
    .where(where)
    .orderBy(asc(surveys.surveyedOn), asc(surveys.id))
    .limit(limit)
    .offset(offset)
    .all();
  const total =
    db.select({ n: count() }).from(surveys).where(where).get()?.n ?? 0;
  return { items, limit, offset, total };
}

export function createSurvey(survey: NewSurvey): Survey {
  return db.insert(surveys).values(survey).returning().get();
}
