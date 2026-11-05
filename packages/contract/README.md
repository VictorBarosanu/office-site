# The field app's data contract

*Written by Claude (Opus 5.5, an AI model) from Dragoș-Paul Pop's design of 2026-10-13; Dragoș owns it and every change to it.*

This repository is the one written description of the **field app's data**:
which things exist, which fields they have, what types and limits those fields
have, and which states they move through. Three kinds of software follow it:

- the **field app** students build in *Mobile Devices Programming* (React
  Native + Expo and Flutter, RAU 2026), on the phone of a field worker;
- the **web labs** of *Advanced Web Development*, which build the office side's
  pieces;
- Dragoș's **office side** (Bun + Hono + tRPC, Drizzle/Postgres), where admins
  plan routes, review photos and track workers.

The **README is the truth**. `contract.ts` (zod 4) and `contract.dart` (plain
Dart) are two mirrors of it, and `test/` runs both over the same fixtures so
they cannot drift apart. If a mirror and this page disagree, the page wins
and the mirror is a bug.

**Version: v1 (2026-10-13).** See [CHANGELOG.md](CHANGELOG.md). Pin the tag you
copied from: `git clone --branch v1 https://github.com/dragospaulpop/field-app-contract`.

## The story in one paragraph

An **admin** at the office hands a **field worker** a **route**: an ordered
list of **entrances** to visit on a day. A building (a block of flats) is made
of one or more entrances, each with its own pin on the map, its own address
(street, number, entrance name) and its own survey. At each entrance the worker
checks that the pin is where the door is (or corrects it), checks or edits the
address, counts stories, flats and elevators, notes the year it was built and
whether the ground floor has shops, writes a comment, and takes **photos**. The
admin reviews every photo and may ask for a **retake**. People talk in
**conversations** (direct, or a broadcast to everyone), leave threaded
**comments** on a building or an entrance, and an admin can start a **tracking
session** to see a worker's live **positions**.

## Rules every entity follows

- **`id`** — a UUID v4 string, made **on the device that creates the row**
  (`expo-crypto`'s `randomUUID()` in Expo, `Uuid().v4()` from Dart's
  `uuid` package in Flutter, `crypto.randomUUID()` on a server). It is never
  rewritten: the phone can create a row offline and the office keeps its id.
- **`createdAt`, `updatedAt`** — ISO-8601 **UTC** strings with a trailing `Z`
  and whole seconds or more (`2026-10-13T16:30:00Z`,
  `2026-10-13T16:30:00.123Z`), set by whoever writes the row. From week 5
  `updatedAt` decides **last writer wins, per field**; it comes from the
  device's clock, which can be wrong — the office side may overwrite it when it
  accepts a change.
- **Every field is always present on the wire.** "Optional" means the value
  may be `null`, never that the key may be missing. Unknown keys are ignored by
  the zod mirror and by `fromJson`.
- **Days** (a route's `date`) are `YYYY-MM-DD`.
- **Coordinates** are WGS 84 degrees: `lat` −90…90, `lng` −180…180.
- **Enums** travel as the lowercase strings listed below.

### Local-only columns — never on the wire

A device keeps two more columns next to its own copy of any row (week 3 on).
They are named here so every team spells them the same way, and they are
**never sent**: a push strips them, the office never stores them.

| column | type | meaning |
|---|---|---|
| `syncState` | `pending` \| `synced` \| `failed` | has the office got this version of the row? |
| `lastError` | string or null | why the last push of this row failed |
| `localUri` | string (photos only) | where the photo's file is on this device |

In `contract.ts` they are `LocalColumns` / `LocalPhotoColumns` and the type
`Local<T>`; in `contract.dart` the classes `LocalColumns` / `LocalPhotoColumns`.

## The entities

### user

A person who signs in. Admins work at the office; field workers carry the phone.

| field | type | required | meaning |
|---|---|---|---|
| `role` | `admin` \| `field` | yes | what the person may do |
| `name` | string, 1–100 | yes | the display name |
| `email` | email | yes | the sign-in address |

### building

What the office calls a building: a block of flats with one or more entrances.

| field | type | required | meaning |
|---|---|---|---|
| `label` | string, 1–100 | yes | the office's name for it ("Bloc U7", "Lipscani 41") |
| `comment` | string ≤ 2000 or null | no | a free-form note about the whole building |

### entrance

One stairwell of a building, with its own door, coordinates and address. **The
pin on the map is an entrance**, and the survey is the entrance's own fields —
there is no separate survey entity. A re-survey edits the same row.

| field | type | required | meaning |
|---|---|---|---|
| `buildingId` | uuid | yes | the building it belongs to |
| `lat`, `lng` | number | yes | where the office placed the pin |
| `street` | string, 1–120 | yes | street name, as checked or edited by the worker |
| `number` | string, 1–20 | yes | street number — a **string** ("17A", "2-4") |
| `entranceName` | string, 1–40 | yes | "Sc. A", "Sc. 2", "Bl. 3" |
| `coordsConfirmed` | boolean | yes | the worker says the pin is at the door |
| `correctedLat`, `correctedLng` | number or null | no | where the door really is, when the pin is wrong |
| `addressConfirmed` | boolean | yes | the worker checked the three address fields |
| `stories` | integer 1–60 or null | no | floors above ground, ground floor included |
| `flats` | integer 1–1000 or null | no | flats served by this entrance |
| `elevators` | integer 0–20 or null | no | elevators in this entrance |
| `yearBuilt` | integer 1800–2100 or null | no | year of construction |
| `groundFloorCommercial` | boolean or null | no | shops or offices on the ground floor |
| `comment` | string ≤ 2000 or null | no | a free-form note about this entrance |
| `surveyStatus` | see below | yes | where the survey is |
| `surveyedBy` | uuid or null | no | the worker who submitted the survey |
| `surveyedAt` | timestamp or null | no | when it was submitted |

Rules:

- **E1** `correctedLat` and `correctedLng` are both null or both set.
- **E2** (from `submitted` on) either `coordsConfirmed` is true or corrected
  coordinates are given.
- **E3** an entrance in `submitted`, `approved` or `needs_rework` has
  `addressConfirmed` true and `stories`, `flats`, `elevators`, `yearBuilt`,
  `groundFloorCommercial`, `surveyedBy`, `surveyedAt` all set.

**The survey form** edits exactly these fields: `coordsConfirmed`,
`correctedLat`, `correctedLng`, `street`, `number`, `entranceName`,
`addressConfirmed`, `stories`, `flats`, `elevators`, `yearBuilt`,
`groundFloorCommercial`, `comment` — with every one of the counts required,
`addressConfirmed` required to be true, and rules E1–E2. `contract.ts` exports
it as `EntranceSurvey`; `contract.dart` as `validateEntranceSurvey` plus one
validator per field (`validateStories`, …) for `TextFormField`s.

**Survey states.**

```
not_started ──(worker opens the form)──▶ in_progress ──(worker submits)──▶ submitted
submitted ──(admin accepts)──▶ approved
submitted ──(admin refuses a photo or a field)──▶ needs_rework ──(worker resubmits)──▶ submitted
```

The worker moves `not_started → in_progress → submitted` and
`needs_rework → submitted`; only an admin moves a row to `approved` or
`needs_rework`. Why a row is in `needs_rework` is told by its photos'
`reviewStatus` and a review comment.

### photo

A picture of an entrance, taken on the phone.

| field | type | required | meaning |
|---|---|---|---|
| `entranceId` | uuid | yes | the entrance in the picture |
| `fileName` | string, 1–200 | yes | the file's name, unique per entrance |
| `remoteUrl` | URL or null | no | where the office stores it, once uploaded |
| `takenAt` | timestamp | yes | when the shutter fired |
| `lat`, `lng` | number or null | no | where (null when there was no fix) |
| `heading` | number 0 ≤ h < 360 or null | no | compass direction the camera faced |
| `uploadState` | `pending` \| `uploaded` \| `failed` | yes | the file's upload, separate from the row's sync |
| `reviewStatus` | `pending` \| `approved` \| `retake` | yes | the admin's verdict |
| `reviewNote` | string ≤ 2000 or null | no | why a retake is needed |
| `reviewedBy` | uuid or null | no | the admin who reviewed it |
| `replacesPhotoId` | uuid or null | no | the refused photo a retake replaces |

Rules: **P1** `retake` needs a `reviewNote`; **P2** any status but `pending`
needs `reviewedBy`. Review states: `pending → approved` or
`pending → retake`; a retake is a **new** photo whose `replacesPhotoId` points
at the refused one (which stays, for the record).

### comment

A threaded note about a place, visible to every worker on a route through it.

| field | type | required | meaning |
|---|---|---|---|
| `scope` | `building` \| `entrance` | yes | what `targetId` points at |
| `targetId` | uuid | yes | the building or entrance |
| `parentId` | uuid or null | no | the comment this replies to |
| `authorId` | uuid | yes | who wrote it |
| `text` | string, 1–2000 | yes | the comment |

### route and routeStop

An admin hands a worker an ordered list of entrances for a day. A **route
stop** is one entrance on it with its status — there is no separate
"assignment".

| route field | type | required | meaning |
|---|---|---|---|
| `adminId` | uuid | yes | who planned it |
| `workerId` | uuid | yes | who walks it |
| `date` | day | yes | the day it is for |
| `name` | string, 1–100 | yes | "Old town and Unirii" |

| routeStop field | type | required | meaning |
|---|---|---|---|
| `routeId` | uuid | yes | the route |
| `entranceId` | uuid | yes | the entrance to visit |
| `order` | integer ≥ 1 | yes | position in the route |
| `status` | `todo` \| `done` \| `skipped` | yes | the worker's progress |

Stop states: `todo → done` (the survey was submitted) or `todo → skipped`
(the worker could not get in; say why in a comment); an admin may set either
back to `todo`.

### trackingSession and position

"Live" tracking is **on demand and in the foreground**: an admin starts a
session, the worker sees a banner and may stop it; while the app is open the
phone sends a position about every 10 s; when it is closed the office shows
"last seen" with the position's age.

| trackingSession field | type | required | meaning |
|---|---|---|---|
| `workerId` | uuid | yes | whose phone |
| `requestedBy` | uuid | yes | the admin who started it |
| `startedAt` | timestamp | yes | start |
| `endedAt` | timestamp or null | no | null while live |

| position field | type | required | meaning |
|---|---|---|---|
| `sessionId` | uuid | yes | the session |
| `lat`, `lng` | number | yes | where |
| `accuracy` | number ≥ 0 | yes | metres (68 % radius, as the OS reports it) |
| `at` | timestamp | yes | when the fix was taken |

### conversation and message

Chat between people: direct (one admin and one worker) or a broadcast to
everyone (only admins start a thread there; workers may reply).

| conversation field | type | required | meaning |
|---|---|---|---|
| `kind` | `direct` \| `broadcast` | yes | |
| `participantIds` | uuid[], ≥ 2 | yes | direct: exactly two different people (rule **C1**); broadcast: everyone at creation |

| message field | type | required | meaning |
|---|---|---|---|
| `conversationId` | uuid | yes | the conversation |
| `authorId` | uuid | yes | who wrote it |
| `text` | string, 1–4000 | yes | the message |
| `sentAt` | timestamp | yes | when it was sent |
| `readAt` | map uuid → timestamp | yes (may be `{}`) | who has read it, and when |

`readAt` is a small map on the message rather than a separate table: the
phone reads its own receipt with one lookup and a conversation has at most a
class of people. Unread for a user = messages not written by them whose
`readAt` has no entry for them. (The office side may store it as a table;
on the wire it is this map.)

Comments, chat and photo review stay three things: a place, people, a
verdict — three different screens and three different queries.

## What the field app ignores until week N

| week | the field app starts using |
|---|---|
| 2 (2026-10-13) | `building`, `entrance` (read + the survey form, in memory), `route` + `routeStop`, `conversation` + `message` (read-only), all from `fixtures/` |
| 3 | `photo` (camera, EXIF, GPS), the local-only columns, entrances stored on the device (SQLite) |
| 4 | everything synced to Firebase; `user` from sign-in |
| 5 | `updatedAt` as last-writer-wins, the outbox, `syncState` / `lastError` |
| 6 | `comment`, `trackingSession` + `position`, messages live |
| 7 | the office side as the backend |

## Files

| file | what |
|---|---|
| `contract.ts` | zod 4 schemas, one per entity, with `z.infer` types; `EntranceSurvey` for the form |
| `contract.dart` | one class per entity with `fromJson` / `toJson`, the enums, `validate*` functions mirroring every rule; `dart:core` only |
| `fixtures/*.json` | 3 users, 6 buildings and 20 entrances on real Bucharest streets (invented numbers), 2 routes with their stops nested under `stops`, 3 conversations, 12 messages |
| `test/contract.test.ts` | `bun test`: every fixture parses; a wrong entrance is refused with eleven issues |
| `test/contract_test.dart` | `dart test`: the same fixtures through `fromJson` + `validate*`; the same eleven issues |

`fixtures/routes.json` nests each route's stops under `stops` for
convenience; on the wire a route and its stops are separate rows.

## Running the tests

```bash
bun install && bun test      # Bun 1.x, zod 4.6.7
dart pub get && dart test    # Dart 3.9+ (Flutter's own `dart` works)
```

## Using it

- **Expo**: copy `contract.ts` to `src/contract/contract.ts` and the
  `fixtures/` folder next to it; `bun add zod@4`.
- **Flutter**: copy `contract.dart` to `lib/contract/contract.dart` and the
  `fixtures/` folder to `assets/fixtures/` (declared under `flutter: assets:`).
- **Web / office side**: import `contract.ts`; write the Drizzle schema next to
  it, one table per entity, the same names.

## Changing it

A change is a new tag (`v1.1`, `v2`) with a line in
[CHANGELOG.md](CHANGELOG.md), both mirrors and both tests updated in the same
commit. Open an issue rather than editing your copy.

## Licence

MIT — see [LICENSE](LICENSE).
