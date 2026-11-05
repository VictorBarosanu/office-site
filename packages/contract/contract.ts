// The field app's data contract, v1 (2026-10-13).
// The truth is README.md; this file and contract.dart mirror it and the tests
// in test/ run both over the same fixtures. Zod 4 (tested with zod 4.6.7).
import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared words
// ---------------------------------------------------------------------------

/** A UUID v4 made on the device that creates the row; never rewritten. */
export const Id = z.uuid();
/** An ISO-8601 UTC timestamp with a trailing Z, e.g. 2026-10-13T16:30:00Z. */
export const Timestamp = z.iso.datetime();
/** A calendar day, e.g. 2026-10-14. */
export const Day = z.iso.date();
export const Lat = z.number().min(-90).max(90);
export const Lng = z.number().min(-180).max(180);

/** Every entity carries these three; the writer sets the two timestamps. */
const Row = z.object({
  id: Id,
  createdAt: Timestamp,
  updatedAt: Timestamp,
});

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const Role = z.enum(["admin", "field"]);
export const SurveyStatus = z.enum([
  "not_started",
  "in_progress",
  "submitted",
  "approved",
  "needs_rework",
]);
export const UploadState = z.enum(["pending", "uploaded", "failed"]);
export const ReviewStatus = z.enum(["pending", "approved", "retake"]);
export const CommentScope = z.enum(["building", "entrance"]);
export const StopStatus = z.enum(["todo", "done", "skipped"]);
export const ConversationKind = z.enum(["direct", "broadcast"]);
export const SyncState = z.enum(["pending", "synced", "failed"]);

// ---------------------------------------------------------------------------
// The surveyed fields, one rule each (the form, week 3's write and week 4's
// push all use these).
// ---------------------------------------------------------------------------

export const Street = z.string().trim().min(1).max(120);
export const StreetNumber = z.string().trim().min(1).max(20);
export const EntranceName = z.string().trim().min(1).max(40);
export const Stories = z.int().min(1).max(60);
export const Flats = z.int().min(1).max(1000);
export const Elevators = z.int().min(0).max(20);
export const YearBuilt = z.int().min(1800).max(2100);
export const FreeText = z.string().max(2000);

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export const User = Row.extend({
  role: Role,
  name: z.string().trim().min(1).max(100),
  email: z.email(),
});

export const Building = Row.extend({
  label: z.string().trim().min(1).max(100),
  comment: FreeText.nullable(),
});

/** The fields of an entrance before the cross-field rules (pick from this). */
export const EntranceFields = Row.extend({
  buildingId: Id,
  // the office's placement (the address three are edited in place by the survey)
  lat: Lat,
  lng: Lng,
  street: Street,
  number: StreetNumber,
  entranceName: EntranceName,
  // the surveyed fields
  coordsConfirmed: z.boolean(),
  correctedLat: Lat.nullable(),
  correctedLng: Lng.nullable(),
  addressConfirmed: z.boolean(),
  stories: Stories.nullable(),
  flats: Flats.nullable(),
  elevators: Elevators.nullable(),
  yearBuilt: YearBuilt.nullable(),
  groundFloorCommercial: z.boolean().nullable(),
  comment: FreeText.nullable(),
  surveyStatus: SurveyStatus,
  surveyedBy: Id.nullable(),
  surveyedAt: Timestamp.nullable(),
});

/** Statuses that mean "a worker sent a complete survey". */
export const SURVEYED: readonly z.infer<typeof SurveyStatus>[] = [
  "submitted",
  "approved",
  "needs_rework",
];

type Issue = { path: (string | number)[]; message: string };

/** Rule E1: corrected coordinates come as a pair. */
function correctedPair(
  e: { correctedLat: number | null; correctedLng: number | null },
  add: (i: Issue) => void
) {
  if ((e.correctedLat === null) !== (e.correctedLng === null)) {
    add({
      path: ["correctedLng"],
      message: "Corrected latitude and longitude come together",
    });
  }
}

/** Rule E2: either the office's coordinates fit, or corrected ones are given. */
function coordsChecked(
  e: { coordsConfirmed: boolean; correctedLat: number | null },
  add: (i: Issue) => void
) {
  if (!e.coordsConfirmed && e.correctedLat === null) {
    add({
      path: ["coordsConfirmed"],
      message: "Confirm the pin, or enter corrected coordinates",
    });
  }
}

export const Entrance = EntranceFields.superRefine((e, ctx) => {
  const add = (i: Issue) => ctx.addIssue({ code: "custom", ...i });
  correctedPair(e, add);
  // Rule E3: a surveyed entrance is complete and says who and when.
  if (SURVEYED.includes(e.surveyStatus)) {
    coordsChecked(e, add);
    if (!e.addressConfirmed) {
      add({ path: ["addressConfirmed"], message: "Check the address" });
    }
    for (const key of [
      "stories",
      "flats",
      "elevators",
      "yearBuilt",
      "groundFloorCommercial",
      "surveyedBy",
      "surveyedAt",
    ] as const) {
      if (e[key] === null) {
        add({ path: [key], message: "Required once the survey is submitted" });
      }
    }
  }
});

/**
 * What the survey form edits and validates: the surveyed fields of an
 * entrance, every one required, with the same cross-field rules.
 */
export const EntranceSurvey = EntranceFields.pick({
  coordsConfirmed: true,
  correctedLat: true,
  correctedLng: true,
  street: true,
  number: true,
  entranceName: true,
  comment: true,
})
  .extend({
    addressConfirmed: z.literal(true, { error: "Check the address" }),
    stories: Stories,
    flats: Flats,
    elevators: Elevators,
    yearBuilt: YearBuilt,
    groundFloorCommercial: z.boolean(),
  })
  .superRefine((e, ctx) => {
    const add = (i: Issue) => ctx.addIssue({ code: "custom", ...i });
    correctedPair(e, add);
    coordsChecked(e, add);
  });

export const Photo = Row.extend({
  entranceId: Id,
  fileName: z.string().trim().min(1).max(200),
  remoteUrl: z.url().nullable(),
  takenAt: Timestamp,
  lat: Lat.nullable(),
  lng: Lng.nullable(),
  heading: z.number().min(0).lt(360).nullable(),
  uploadState: UploadState,
  reviewStatus: ReviewStatus,
  reviewNote: FreeText.nullable(),
  reviewedBy: Id.nullable(),
  replacesPhotoId: Id.nullable(),
}).superRefine((p, ctx) => {
  // Rule P1: a retake asks why.
  if (p.reviewStatus === "retake" && !p.reviewNote) {
    ctx.addIssue({
      code: "custom",
      path: ["reviewNote"],
      message: "Say why the photo must be retaken",
    });
  }
  // Rule P2: a reviewed photo says who reviewed it.
  if (p.reviewStatus !== "pending" && p.reviewedBy === null) {
    ctx.addIssue({
      code: "custom",
      path: ["reviewedBy"],
      message: "A reviewed photo names its reviewer",
    });
  }
});

export const Comment = Row.extend({
  scope: CommentScope,
  targetId: Id,
  parentId: Id.nullable(),
  authorId: Id,
  text: z.string().trim().min(1).max(2000),
});

export const Route = Row.extend({
  adminId: Id,
  workerId: Id,
  date: Day,
  name: z.string().trim().min(1).max(100),
});

export const RouteStop = Row.extend({
  routeId: Id,
  entranceId: Id,
  order: z.int().min(1),
  status: StopStatus,
});

export const TrackingSession = Row.extend({
  workerId: Id,
  requestedBy: Id,
  startedAt: Timestamp,
  endedAt: Timestamp.nullable(),
});

export const Position = Row.extend({
  sessionId: Id,
  lat: Lat,
  lng: Lng,
  accuracy: z.number().min(0),
  at: Timestamp,
});

export const Conversation = Row.extend({
  kind: ConversationKind,
  participantIds: z.array(Id).min(2),
}).superRefine((c, ctx) => {
  // Rule C1: a direct conversation is exactly two different people.
  if (
    c.kind === "direct" &&
    (c.participantIds.length !== 2 ||
      c.participantIds[0] === c.participantIds[1])
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["participantIds"],
      message: "A direct conversation has exactly two different people",
    });
  }
});

export const Message = Row.extend({
  conversationId: Id,
  authorId: Id,
  text: z.string().trim().min(1).max(4000),
  sentAt: Timestamp,
  /** userId → when that participant read it; the author is never in it. */
  readAt: z.record(Id, Timestamp),
});

// ---------------------------------------------------------------------------
// Local-only columns: NEVER ON THE WIRE. The device adds them to its own copy
// of a row (week 3 on); a push strips them; the office never sees them.
// ---------------------------------------------------------------------------

export const LocalColumns = z.object({
  syncState: SyncState,
  lastError: z.string().nullable(),
});

/** A photo on the device also knows where its file is. */
export const LocalPhotoColumns = LocalColumns.extend({
  localUri: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Role = z.infer<typeof Role>;
export type SurveyStatus = z.infer<typeof SurveyStatus>;
export type UploadState = z.infer<typeof UploadState>;
export type ReviewStatus = z.infer<typeof ReviewStatus>;
export type CommentScope = z.infer<typeof CommentScope>;
export type StopStatus = z.infer<typeof StopStatus>;
export type ConversationKind = z.infer<typeof ConversationKind>;
export type SyncState = z.infer<typeof SyncState>;

export type User = z.infer<typeof User>;
export type Building = z.infer<typeof Building>;
export type Entrance = z.infer<typeof Entrance>;
export type EntranceSurvey = z.infer<typeof EntranceSurvey>;
export type Photo = z.infer<typeof Photo>;
export type Comment = z.infer<typeof Comment>;
export type Route = z.infer<typeof Route>;
export type RouteStop = z.infer<typeof RouteStop>;
export type TrackingSession = z.infer<typeof TrackingSession>;
export type Position = z.infer<typeof Position>;
export type Conversation = z.infer<typeof Conversation>;
export type Message = z.infer<typeof Message>;
export type LocalColumns = z.infer<typeof LocalColumns>;
export type LocalPhotoColumns = z.infer<typeof LocalPhotoColumns>;
/** A row as the device stores it: the entity plus the local-only columns. */
export type Local<T> = T & LocalColumns;
