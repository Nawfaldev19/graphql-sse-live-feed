import type { ActivityKind, Db, Role } from "../db/database.js";

export interface ActivityRecord {
  id: number;
  spaceId: string;
  kind: ActivityKind;
  summary: string;
  createdAt: string;
  actor: { id: string; name: string };
}

export interface SpaceMembership {
  spaceId: string;
  spaceName: string;
  role: Role;
}

interface ActivityRow {
  id: number;
  space_id: string;
  kind: ActivityKind;
  summary: string;
  created_at: string;
  actor_id: string;
  actor_name: string;
}

const toRecord = (row: ActivityRow): ActivityRecord => ({
  id: row.id,
  spaceId: row.space_id,
  kind: row.kind,
  summary: row.summary,
  createdAt: row.created_at,
  actor: { id: row.actor_id, name: row.actor_name },
});

const SELECT_ACTIVITY = `
  SELECT a.id, a.space_id, a.kind, a.summary, a.created_at, a.actor_id, p.name AS actor_name
  FROM activities a JOIN people p ON p.id = a.actor_id`;

/**
 * All SQL lives here. Every activity query takes a spaceId, so callers cannot
 * forget the tenant filter; authorization (is this person in that space?) is
 * checked by the GraphQL layer before any of these run.
 */
export function createRepository(db: Db) {
  const statements = {
    person: db.prepare("SELECT id, name FROM people WHERE id = ?"),
    people: db.prepare("SELECT id, name FROM people ORDER BY name"),
    memberships: db.prepare(`
      SELECT m.space_id AS spaceId, s.name AS spaceName, m.role AS role
      FROM memberships m JOIN spaces s ON s.id = m.space_id
      WHERE m.person_id = ?
      ORDER BY s.name`),
    membership: db.prepare("SELECT role FROM memberships WHERE person_id = ? AND space_id = ?"),
    insert: db.prepare(`
      INSERT INTO activities (space_id, actor_id, kind, summary, created_at)
      VALUES (?, ?, ?, ?, ?)`),
    byId: db.prepare(`${SELECT_ACTIVITY} WHERE a.id = ?`),
    page: db.prepare(`${SELECT_ACTIVITY}
      WHERE a.space_id = @spaceId
        AND (@kind IS NULL OR a.kind = @kind)
        AND (@before IS NULL OR a.id < @before)
      ORDER BY a.id DESC
      LIMIT @limit`),
    unread: db.prepare(`
      SELECT COUNT(*) AS count FROM activities a
      WHERE a.space_id = ?
        AND a.actor_id != ?
        AND NOT EXISTS (SELECT 1 FROM reads r WHERE r.person_id = ? AND r.activity_id = a.id)`),
    markAll: db.prepare(`
      INSERT OR IGNORE INTO reads (person_id, activity_id, read_at)
      SELECT @personId, a.id, @now FROM activities a
      WHERE a.space_id = @spaceId AND a.actor_id != @personId`),
  };

  return {
    findPerson(id: string): { id: string; name: string } | undefined {
      return statements.person.get(id) as { id: string; name: string } | undefined;
    },

    listPeople(): { id: string; name: string }[] {
      return statements.people.all() as { id: string; name: string }[];
    },

    membershipsOf(personId: string): SpaceMembership[] {
      return statements.memberships.all(personId) as SpaceMembership[];
    },

    roleIn(personId: string, spaceId: string): Role | null {
      const row = statements.membership.get(personId, spaceId) as { role: Role } | undefined;
      return row?.role ?? null;
    },

    addActivity(input: {
      spaceId: string;
      actorId: string;
      kind: ActivityKind;
      summary: string;
      at?: Date;
    }): ActivityRecord {
      const result = statements.insert.run(
        input.spaceId,
        input.actorId,
        input.kind,
        input.summary,
        (input.at ?? new Date()).toISOString(),
      );
      return toRecord(statements.byId.get(result.lastInsertRowid) as ActivityRow);
    },

    /** Newest first. Fetches one extra row to know whether an older page exists. */
    page(input: { spaceId: string; kind: ActivityKind | null; beforeId: number | null; limit: number }): {
      items: ActivityRecord[];
      hasMore: boolean;
    } {
      const rows = statements.page.all({
        spaceId: input.spaceId,
        kind: input.kind,
        before: input.beforeId,
        limit: input.limit + 1,
      }) as ActivityRow[];
      return { items: rows.slice(0, input.limit).map(toRecord), hasMore: rows.length > input.limit };
    },

    /** Of the given ids, which has this person read? One query for any number of ids; own activity counts as read. */
    readIds(personId: string, activityIds: readonly number[]): Set<number> {
      if (activityIds.length === 0) return new Set();
      const placeholders = activityIds.map(() => "?").join(",");
      const rows = db
        .prepare(
          `SELECT a.id FROM activities a
           WHERE a.id IN (${placeholders})
             AND (a.actor_id = ? OR EXISTS (SELECT 1 FROM reads r WHERE r.person_id = ? AND r.activity_id = a.id))`,
        )
        .all(...activityIds, personId, personId) as { id: number }[];
      return new Set(rows.map((row) => row.id));
    },

    unreadCount(personId: string, spaceId: string): number {
      return (statements.unread.get(spaceId, personId, personId) as { count: number }).count;
    },

    /** Marks the given activities read, ignoring ids that are not in this space. */
    markRead(personId: string, spaceId: string, activityIds: readonly number[], now = new Date()): void {
      if (activityIds.length === 0) return;
      const placeholders = activityIds.map(() => "?").join(",");
      db.prepare(
        `INSERT OR IGNORE INTO reads (person_id, activity_id, read_at)
         SELECT ?, a.id, ? FROM activities a
         WHERE a.space_id = ? AND a.id IN (${placeholders})`,
      ).run(personId, now.toISOString(), spaceId, ...activityIds);
    },

    markAllRead(personId: string, spaceId: string, now = new Date()): void {
      statements.markAll.run({ personId, spaceId, now: now.toISOString() });
    },
  };
}

export type Repository = ReturnType<typeof createRepository>;
