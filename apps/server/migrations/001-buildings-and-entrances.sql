-- 001: the office's first two tables; a building has many entrances
CREATE TABLE buildings (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL
) STRICT;

CREATE TABLE entrances (
  id INTEGER PRIMARY KEY,
  building_id INTEGER NOT NULL REFERENCES buildings (id),
  address TEXT NOT NULL,
  floors INTEGER NOT NULL CHECK (floors >= 0),
  -- SQLite has no boolean: 0 or 1, and nothing else
  has_elevator INTEGER NOT NULL CHECK (has_elevator IN (0, 1))
) STRICT;