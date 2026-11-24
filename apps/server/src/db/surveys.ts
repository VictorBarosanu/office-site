// apps/server/src/db/surveys.ts — the queries for surveys; routes call these functions
import type { NewSurvey, Page, PageQuery, Survey } from "@office/shared";
import { asc, count, eq } from "drizzle-orm";
import { db } from "../db";
import { surveys } from "./schema";

// no timestamps here: surveyedOn is a date, and mode "string" gives it back as 2026-11-25
export async function listSurveys(
  { limit, offset }: PageQuery,
  entranceId?: string
): Promise<Page<Survey>> {
  const where = entranceId ? eq(surveys.entranceId, entranceId) : undefined;
  const items = await db
    .select()
    .from(surveys)
    .where(where)
    .orderBy(asc(surveys.surveyedOn), asc(surveys.id))
    .limit(limit)
    .offset(offset);
  const [counted] = await db.select({ n: count() }).from(surveys).where(where);
  return { items, limit, offset, total: counted?.n ?? 0 };
}

export async function createSurvey(survey: NewSurvey): Promise<Survey> {
  const [created] = await db.insert(surveys).values(survey).returning();
  if (!created) {
    throw new Error("INSERT … RETURNING gave back no row");
  }
  return created;
}
