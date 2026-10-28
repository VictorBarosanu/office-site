-- 002: a survey is one visit to one entrance (its endpoints: the invitation)
CREATE TABLE surveys (
  id INTEGER PRIMARY KEY,
  entrance_id INTEGER NOT NULL REFERENCES entrances (id),
  surveyed_on TEXT NOT NULL, -- an ISO date: 2026-10-28
  surveyor TEXT NOT NULL,
  notes TEXT
) STRICT;