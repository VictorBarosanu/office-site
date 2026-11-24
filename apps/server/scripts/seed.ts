// apps/server/scripts/seed.ts — the contract's fixtures as development rows; never in production
import {
  Building,
  Entrance,
  Route,
  RouteStop,
  User,
} from "field-app-contract/contract";
import buildingRows from "field-app-contract/fixtures/buildings.json";
import entranceRows from "field-app-contract/fixtures/entrances.json";
import routeRows from "field-app-contract/fixtures/routes.json";
import userRows from "field-app-contract/fixtures/users.json";
import { db } from "../src/db";
import {
  account,
  buildings,
  entrances,
  routeStops,
  routes,
  session,
  surveys,
  users,
} from "../src/db/schema";
import { truncate } from "../src/db/truncate";

// every fixture user signs in with this password: SEED_PASSWORD in apps/server/.env
// the fixtures' ISO text, as the Dates a timestamp column takes
const at = <T extends { createdAt: string; updatedAt: string }>(row: T) => ({
  ...row,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
});

export async function seed(password: string | undefined) {
  if (!password || password.length < 8) {
    throw new Error(
      "Set SEED_PASSWORD (8 characters or more) in apps/server/.env: copy .env.example"
    );
  }
  // the contract checks its own fixtures before they go in
  const buildingList = Building.array().parse(buildingRows).map(at);
  const entranceList = Entrance.array()
    .parse(entranceRows)
    .map((entrance) => ({
      ...at(entrance),
      surveyedAt: entrance.surveyedAt ? new Date(entrance.surveyedAt) : null,
    }));
  // emails are stored lowercase: sign-in lowercases what it is given
  const userList = User.array()
    .parse(userRows)
    .map((user) => ({ ...at(user), email: user.email.toLowerCase() }));
  // a fixture route holds its stops: Route drops them, so parse them apart
  const routeList = Route.array().parse(routeRows).map(at);
  const stopList = RouteStop.array()
    .parse(routeRows.flatMap((r) => r.stops))
    .map(at);
  // a hash per user: argon2id, with its own salt
  const accounts = await Promise.all(
    userList.map(async (user) => ({
      accountId: user.id,
      password: await Bun.password.hash(password),
      providerId: "credential",
      userId: user.id,
    }))
  );
  // every table empty first: one TRUNCATE, which also starts every test file that seeds
  await truncate(
    session,
    account,
    routeStops,
    routes,
    users,
    surveys,
    entrances,
    buildings
  );
  await db.transaction(async (tx) => {
    await tx.insert(buildings).values(buildingList);
    await tx.insert(entrances).values(entranceList);
    await tx.insert(users).values(userList);
    await tx.insert(account).values(accounts);
    await tx.insert(routes).values(routeList);
    await tx.insert(routeStops).values(stopList);
  });
}

if (import.meta.main) {
  await seed(Bun.env.SEED_PASSWORD);
  console.log({
    accounts: await db.$count(account),
    buildings: await db.$count(buildings),
    entrances: await db.$count(entrances),
    routeStops: await db.$count(routeStops),
    routes: await db.$count(routes),
    sessions: await db.$count(session),
    surveys: await db.$count(surveys),
    users: await db.$count(users),
  });
  // the pool keeps the process alive until it is closed
  await db.$client.end();
}
