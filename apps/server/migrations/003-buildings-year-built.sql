-- 003: a building's year; old rows get NULL (unknown), new ones may say it
ALTER TABLE buildings ADD COLUMN year_built INTEGER
  CHECK (year_built BETWEEN 1800 AND 2100);