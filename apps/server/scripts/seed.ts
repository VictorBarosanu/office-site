// apps/server/scripts/seed.ts — known example rows for development; never in production
import { db } from "../src/db";

const seed = db.transaction(() => {
  // children first: a building cannot go while its entrances point at it
  db.run("DELETE FROM surveys");
  db.run("DELETE FROM entrances");
  db.run("DELETE FROM buildings");

  const building = db.query(
    "INSERT INTO buildings (id, name, city) VALUES (?, ?, ?)"
  );
  building.run(1, "Bloc Lalelelor 4", "București");
  building.run(2, "Bloc Unirii 12", "București");

  const entrance = db.query(
    "INSERT INTO entrances (id, building_id, address, floors, has_elevator) VALUES (?, ?, ?, ?, ?)"
  );
  entrance.run(1, 1, "Str. Lalelelor 4, scara A", 4, 0);
  entrance.run(2, 2, "Bd. Unirii 12, scara B", 10, 1);
  entrance.run(3, 2, "Calea Victoriei 101", 7, 1);

  const survey = db.query(
    "INSERT INTO surveys (entrance_id, surveyed_on, surveyor, notes) VALUES (?, ?, ?, ?)"
  );
  survey.run(1, "2026-10-21", "Ana Pop", "Cracked step on floor 2");
  survey.run(2, "2026-10-22", "Mihai Ionescu", null);
  survey.run(3, "2026-10-23", "Ana Pop", "Elevator out of order");
});

seed();
console.log(
  db
    .query(
      "SELECT (SELECT count(*) FROM buildings) AS buildings, (SELECT count(*) FROM entrances) AS entrances, (SELECT count(*) FROM surveys) AS surveys"
    )
    .get()
);
