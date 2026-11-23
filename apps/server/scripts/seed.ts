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
  surveys,
  users,
} from "../src/db/schema";

// every fixture user signs in with this password: SEED_PASSWORD in apps/server/.env
export function seed(password: string | undefined) {
  if (!password || password.length < 8) {
    throw new Error(
      "Set SEED_PASSWORD (8 characters or more) in apps/server/.env: copy .env.example"
    );
  }
  // the contract checks its own fixtures before they go in
  const buildingList = Building.array().parse(buildingRows);
  const entranceList = Entrance.array().parse(entranceRows);
  // emails are stored lowercase: sign-in lowercases what it is given
  const userList = User.array()
    .parse(userRows)
    .map((user) => ({ ...user, email: user.email.toLowerCase() }));
  // a fixture route holds its stops: Route drops them, so parse them apart
  const routeList = Route.array().parse(routeRows);
  const stopList = RouteStop.array().parse(routeRows.flatMap((r) => r.stops));
  // a hash per user: argon2id, with its own salt (hashSync: the transaction below is sync)
  const accounts = userList.map((user) => ({
    accountId: user.id,
    password: Bun.password.hashSync(password),
    providerId: "credential",
    userId: user.id,
  }));
  db.transaction((tx) => {
    // children first: a building cannot go while its entrances point at it
    tx.delete(account).run();
    tx.delete(routeStops).run();
    tx.delete(routes).run();
    tx.delete(users).run();
    tx.delete(surveys).run();
    tx.delete(entrances).run();
    tx.delete(buildings).run();
    tx.insert(buildings).values(buildingList).run();
    tx.insert(entrances).values(entranceList).run();
    tx.insert(users).values(userList).run();
    tx.insert(account).values(accounts).run();
    tx.insert(routes).values(routeList).run();
    tx.insert(routeStops).values(stopList).run();
  });
}

if (import.meta.main) {
  seed(Bun.env.SEED_PASSWORD);
  console.log({
    accounts: await db.$count(account),
    buildings: await db.$count(buildings),
    entrances: await db.$count(entrances),
    routeStops: await db.$count(routeStops),
    routes: await db.$count(routes),
    surveys: await db.$count(surveys),
    users: await db.$count(users),
  });
}
