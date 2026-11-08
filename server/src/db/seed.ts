import type { ActivityKind, Db, Role } from "./database.js";

// Every person and place here is fictional.
export const DEMO_SPACES = [
  { id: "riverside", name: "Riverside Makers" },
  { id: "foundry", name: "Foundry Lane Workshop" },
] as const;

export const DEMO_PEOPLE = [
  { id: "ada", name: "Ada Okafor", roles: { riverside: "owner", foundry: "member" } },
  { id: "ben", name: "Ben Lindqvist", roles: { riverside: "staff" } },
  { id: "cora", name: "Cora Mbeki", roles: { riverside: "member" } },
  { id: "theo", name: "Theo Marsh", roles: { foundry: "owner" } },
  { id: "priya", name: "Priya Raman", roles: { foundry: "member" } },
] as const satisfies readonly { id: string; name: string; roles: Partial<Record<string, Role>> }[];

const HISTORY: [space: string, actor: string, kind: ActivityKind, summary: string][] = [
  [
    "riverside",
    "ada",
    "announcement",
    "Welcome to the new activity feed. Bookings and changes show up here as they happen.",
  ],
  ["riverside", "ben", "equipment", "Added a second soldering station to the electronics bench."],
  ["riverside", "cora", "booking", "Booked the Wood lathe for Thursday 18:00."],
  ["riverside", "ben", "booking", "Booked the Laser cutter (60 W) for Friday 10:00."],
  ["foundry", "theo", "announcement", "Kiln firing on Saturday. Get pieces on the shelf by Friday night."],
  ["foundry", "priya", "booking", "Booked Pottery wheel 1 for Wednesday 19:30."],
  ["foundry", "ada", "membership", "Joined Foundry Lane Workshop."],
];

/** Inserts demo data when the database is empty. Returns true if it seeded. */
export function seedIfEmpty(db: Db, now = new Date()): boolean {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM people").get() as { count: number };
  if (count > 0) return false;

  const insert = db.transaction(() => {
    const space = db.prepare("INSERT INTO spaces (id, name) VALUES (?, ?)");
    const person = db.prepare("INSERT INTO people (id, name) VALUES (?, ?)");
    const membership = db.prepare("INSERT INTO memberships (person_id, space_id, role) VALUES (?, ?, ?)");
    const activity = db.prepare(
      "INSERT INTO activities (space_id, actor_id, kind, summary, created_at) VALUES (?, ?, ?, ?, ?)",
    );

    for (const item of DEMO_SPACES) space.run(item.id, item.name);
    for (const item of DEMO_PEOPLE) {
      person.run(item.id, item.name);
      for (const [spaceId, role] of Object.entries(item.roles)) membership.run(item.id, spaceId, role);
    }
    HISTORY.forEach(([spaceId, actorId, kind, summary], index) => {
      const minutesAgo = (HISTORY.length - index) * 45;
      activity.run(spaceId, actorId, kind, summary, new Date(now.getTime() - minutesAgo * 60_000).toISOString());
    });
  });
  insert();
  return true;
}
