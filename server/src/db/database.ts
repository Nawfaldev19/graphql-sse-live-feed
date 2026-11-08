import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";

export type Db = Database.Database;

export const ACTIVITY_KINDS = ["booking", "announcement", "equipment", "membership"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];
export type Role = "owner" | "staff" | "member";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS spaces (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS people (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS memberships (
  person_id TEXT NOT NULL REFERENCES people(id),
  space_id  TEXT NOT NULL REFERENCES spaces(id),
  role      TEXT NOT NULL CHECK (role IN ('owner', 'staff', 'member')),
  PRIMARY KEY (person_id, space_id)
);
CREATE TABLE IF NOT EXISTS activities (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  space_id   TEXT NOT NULL REFERENCES spaces(id),
  actor_id   TEXT NOT NULL REFERENCES people(id),
  kind       TEXT NOT NULL CHECK (kind IN ('booking', 'announcement', 'equipment', 'membership')),
  summary    TEXT NOT NULL CHECK (length(summary) BETWEEN 1 AND 280),
  created_at TEXT NOT NULL
);
-- Keyset pagination walks one space's feed from newest to oldest by id.
CREATE INDEX IF NOT EXISTS activities_space_feed ON activities (space_id, id DESC);
CREATE INDEX IF NOT EXISTS activities_space_kind_feed ON activities (space_id, kind, id DESC);
CREATE TABLE IF NOT EXISTS reads (
  person_id   TEXT NOT NULL REFERENCES people(id),
  activity_id INTEGER NOT NULL REFERENCES activities(id),
  read_at     TEXT NOT NULL,
  PRIMARY KEY (person_id, activity_id)
);
`;

/** Opens (and creates, if needed) the database and applies the schema. `:memory:` is used by tests. */
export function openDatabase(path: string): Db {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}
