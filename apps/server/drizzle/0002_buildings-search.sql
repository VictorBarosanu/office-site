-- Custom SQL migration file, put your code below! --
-- Custom SQL migration file, put your code below! --
-- Full-text search over the buildings: Drizzle has no FTS5 tables, so this file is
-- written by hand (drizzle-kit generate --custom). An external-content table: the text
-- stays in buildings, buildings_fts keeps only the index, and three triggers keep it current.
CREATE VIRTUAL TABLE buildings_fts USING fts5(label, comment, content='buildings', content_rowid='rowid');
--> statement-breakpoint
CREATE TRIGGER buildings_fts_insert AFTER INSERT ON buildings BEGIN
  INSERT INTO buildings_fts(rowid, label, comment) VALUES (new.rowid, new.label, new.comment);
END;
--> statement-breakpoint
CREATE TRIGGER buildings_fts_delete AFTER DELETE ON buildings BEGIN
  INSERT INTO buildings_fts(buildings_fts, rowid, label, comment) VALUES ('delete', old.rowid, old.label, old.comment);
END;
--> statement-breakpoint
CREATE TRIGGER buildings_fts_update AFTER UPDATE ON buildings BEGIN
  INSERT INTO buildings_fts(buildings_fts, rowid, label, comment) VALUES ('delete', old.rowid, old.label, old.comment);
  INSERT INTO buildings_fts(rowid, label, comment) VALUES (new.rowid, new.label, new.comment);
END;
--> statement-breakpoint
-- the buildings already in the table: index them once
INSERT INTO buildings_fts(buildings_fts) VALUES ('rebuild');