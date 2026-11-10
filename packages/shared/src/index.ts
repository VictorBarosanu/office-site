// packages/shared/src/index.ts — what only the office has: the forms' input, the surveys
import {
  Building,
  EntranceFields,
  FreeText,
  Id,
} from "field-app-contract/contract";
import { z } from "zod";

// what the office sends to create a building; the server adds id and timestamps
export const NewBuilding = Building.pick({ label: true }).extend({
  comment: FreeText.nullable().default(null),
});
export type NewBuilding = z.infer<typeof NewBuilding>;

// the office places an entrance; the field app surveys it later
export const NewEntrance = EntranceFields.pick({
  buildingId: true,
  entranceName: true,
  lat: true,
  lng: true,
  number: true,
  street: true,
});
export type NewEntrance = z.infer<typeof NewEntrance>;

// not in the contract: the office's own visits, in the office's own table
export const NewSurvey = z.object({
  entranceId: Id,
  notes: z.string().trim().nullable().default(null),
  surveyedOn: z.iso.date("Surveyed on must be a date: 2026-10-28"),
  surveyor: z.string().trim().min(1, "Surveyor is required"),
});
export type NewSurvey = z.infer<typeof NewSurvey>;
export type Survey = NewSurvey & { id: string };

// { street?: string[], lat?: string[], … } — the shape both sides show
export function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors;
}
