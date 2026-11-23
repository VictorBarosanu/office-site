// packages/shared/src/index.ts — what only the office has: the forms' input, the surveys
import {
  Building,
  EntranceFields,
  FreeText,
  Id,
  Route,
  RouteStop,
  User,
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

// a route as the API sends it: the row and its stops, in order
export const RouteWithStops = Route.extend({ stops: z.array(RouteStop) });

// not in the contract: the office's own visits, in the office's own table
export const NewSurvey = z.object({
  entranceId: Id,
  notes: z.string().trim().nullable().default(null),
  surveyedOn: z.iso.date("Surveyed on must be a date: 2026-10-28"),
  surveyor: z.string().trim().min(1, "Surveyor is required"),
});
export type NewSurvey = z.infer<typeof NewSurvey>;
export const Survey = NewSurvey.extend({ id: Id });
export type Survey = z.infer<typeof Survey>;

// an admin adds a user: the contract's fields, and a first password for their account
export const NewUser = User.pick({
  email: true,
  name: true,
  role: true,
}).extend({
  // lowercase, like the emails sign-in looks for
  email: z.string().trim().toLowerCase().pipe(z.email("Type an email")),
  password: z.string().min(8, "At least 8 characters"),
});
export type NewUser = z.infer<typeof NewUser>;

// what the sign-in form sends
export const SignIn = z.object({
  // trimmed and lowercased first: "Irina.Matei@Example.com " is the same address
  email: z.string().trim().toLowerCase().pipe(z.email("Type your email")),
  password: z.string().min(1, "Type your password"),
});
export type SignIn = z.infer<typeof SignIn>;

// ?limit=10&offset=40: the query string's text, as numbers, with the defaults
export const PageQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});
export type PageQuery = z.infer<typeof PageQuery>;

// every list the API answers with: one page of items, and how many there are
export const pageOf = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    limit: z.number().int(),
    offset: z.number().int(),
    total: z.number().int(),
  });
export interface Page<T> {
  items: T[];
  limit: number;
  offset: number;
  total: number;
}

// every 4xx and 5xx (RFC 9457 problem details); errors only on a 400
export const Problem = z.object({
  detail: z.string(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
  instance: z.string(),
  status: z.number().int(),
  title: z.string(),
  type: z.string(),
});
export type Problem = z.infer<typeof Problem>;

// { street?: string[], lat?: string[], … } — the shape both sides show
export function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors;
}
