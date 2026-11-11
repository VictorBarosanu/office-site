// packages/shared/src/index.ts — what only the office has: the forms' input, the surveys
import {
  Building,
  EntranceFields,
  FreeText,
  Id,
  Route,
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

// an assignment: the office gives a field worker a day's entrances, in order;
// the server adds the admin (there is no sign-in yet), the ids and the stops.
// The contract's Route rules, with messages a person can act on.
export const NewRoute = Route.pick({ date: true, name: true, workerId: true })
  .extend({
    date: z.iso.date("Pick a day"),
    entranceIds: z.array(Id).min(1, "Pick at least one entrance"),
    name: z.string().trim().min(1, "Name the assignment").max(100),
    workerId: z.uuid("Pick a field worker"),
  })
  .refine((r) => new Set(r.entranceIds).size === r.entranceIds.length, {
    message: "An entrance is in the list twice",
    path: ["entranceIds"],
  });
export type NewRoute = z.infer<typeof NewRoute>;

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
