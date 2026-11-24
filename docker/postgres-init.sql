-- docker/postgres-init.sql — Postgres runs this once, on an empty volume
-- the tests' own database, next to the app's: bun test empties it, never office
CREATE DATABASE office_test;