import { describe, expect, test } from "bun:test";
import type { z } from "zod";
import {
  Building,
  Conversation,
  Entrance,
  EntranceSurvey,
  Message,
  Route,
  RouteStop,
  User,
} from "../contract";

const load = async (name: string): Promise<unknown[]> =>
  Bun.file(new URL(`../fixtures/${name}.json`, import.meta.url)).json();

const parsesAll = (schema: z.ZodType, rows: unknown[]) => {
  for (const row of rows) {
    const r = schema.safeParse(row);
    if (!r.success) {
      throw new Error(`${JSON.stringify(row).slice(0, 80)}…\n${r.error.message}`);
    }
  }
};

describe("every fixture parses with its schema", () => {
  test("users", async () => parsesAll(User, await load("users")));
  test("buildings", async () => parsesAll(Building, await load("buildings")));
  test("entrances", async () => {
    const rows = await load("entrances");
    expect(rows.length).toBe(20);
    parsesAll(Entrance, rows);
  });
  test("routes and their stops", async () => {
    const routes = (await load("routes")) as { stops: unknown[] }[];
    expect(routes.length).toBe(2);
    parsesAll(Route, routes);
    for (const r of routes) parsesAll(RouteStop, r.stops);
  });
  test("conversations", async () =>
    parsesAll(Conversation, await load("conversations")));
  test("messages", async () => parsesAll(Message, await load("messages")));
});

describe("a wrong one is refused", () => {
  test("wrong-entrance.json breaks eleven rules", async () => {
    const wrong = await Bun.file(
      new URL("./wrong-entrance.json", import.meta.url)
    ).json();
    const r = Entrance.safeParse(wrong);
    expect(r.success).toBe(false);
    const paths = [
      ...new Set(r.error?.issues.map((i) => i.path.join("."))),
    ].sort();
    // the same list test/contract_test.dart expects from validateEntrance
    expect(paths).toEqual([
      "addressConfirmed",
      "correctedLng",
      "elevators",
      "flats",
      "groundFloorCommercial",
      "id",
      "stories",
      "surveyedAt",
      "surveyedBy",
      "updatedAt",
      "yearBuilt",
    ]);
  });
  test("a direct conversation with three people", async () => {
    const [direct] = (await load("conversations")) as {
      participantIds: string[];
    }[];
    const bad = {
      ...direct,
      participantIds: [...direct.participantIds, crypto.randomUUID()],
    };
    expect(Conversation.safeParse(bad).success).toBe(false);
  });
  test("an empty survey form lists every missing field", () => {
    const r = EntranceSurvey.safeParse({
      coordsConfirmed: false,
      correctedLat: null,
      correctedLng: null,
      street: "Strada Lipscani",
      number: "41",
      entranceName: "Sc. A",
      addressConfirmed: false,
      stories: Number.NaN,
      flats: 12,
      elevators: 0,
      yearBuilt: 1902,
      groundFloorCommercial: true,
      comment: null,
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path.join(".")).sort()).toEqual([
      "addressConfirmed",
      "stories",
    ]);
  });
});
