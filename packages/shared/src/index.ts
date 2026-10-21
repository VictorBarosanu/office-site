// packages/shared/src/index.ts — one schema, used by the server and the web
import { z } from "zod";

export const NewEntrance = z.object({
  address: z.string().trim().min(1, "Address is required"),
  floors: z
    .number("Floors must be a number")
    .int("Floors must be a whole number")
    .min(0, "Floors cannot be negative"),
  hasElevator: z.boolean("Say whether there is an elevator"),
});

// the type comes from the schema: change one, the other follows
export type NewEntrance = z.infer<typeof NewEntrance>;
export type Entrance = NewEntrance & { id: number };

// { address?: string[], floors?: string[], … } — the shape both sides show
export function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors;
}
