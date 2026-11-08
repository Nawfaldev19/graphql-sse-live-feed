import { openDatabase } from "../src/db/database.js";
import { seedIfEmpty } from "../src/db/seed.js";
import { createRepository } from "../src/feed/repository.js";

function setupRepository() {
  const db = openDatabase(":memory:");
  seedIfEmpty(db);
  return { db, repository: createRepository(db) };
}

describe("repository", () => {
  it("seeds once", () => {
    const { db } = setupRepository();
    expect(seedIfEmpty(db)).toBe(false);
  });

  it("pages newest first with keyset cursors that stay correct while new items arrive", () => {
    const { repository } = setupRepository();
    const first = repository.page({ spaceId: "riverside", kind: null, beforeId: null, limit: 2 });
    expect(first.hasMore).toBe(true);

    repository.addActivity({ spaceId: "riverside", actorId: "cora", kind: "booking", summary: "New while paging" });
    const second = repository.page({
      spaceId: "riverside",
      kind: null,
      beforeId: first.items.at(-1)?.id ?? null,
      limit: 2,
    });

    const seen = [...first.items, ...second.items].map((item) => item.id);
    expect(new Set(seen).size).toBe(4);
    expect(seen).toEqual([...seen].sort((a, b) => b - a));
    expect(second.hasMore).toBe(false);
    expect(second.items.map((item) => item.summary)).not.toContain("New while paging");
  });

  it("filters by kind and never returns another space's items", () => {
    const { repository } = setupRepository();
    const bookings = repository.page({ spaceId: "riverside", kind: "booking", beforeId: null, limit: 50 });
    expect(bookings.items.every((item) => item.kind === "booking" && item.spaceId === "riverside")).toBe(true);
    expect(bookings.items).toHaveLength(2);
  });

  it("counts unread, excluding own activity, and marks read only within the space", () => {
    const { repository } = setupRepository();
    expect(repository.unreadCount("cora", "riverside")).toBe(3);

    const foundryItem = repository.page({ spaceId: "foundry", kind: null, beforeId: null, limit: 1 }).items[0];
    const riversideItem = repository.page({ spaceId: "riverside", kind: null, beforeId: null, limit: 1 }).items[0];
    repository.markRead("cora", "riverside", [foundryItem?.id ?? 0, riversideItem?.id ?? 0]);

    expect(repository.unreadCount("cora", "riverside")).toBe(2);
    expect(repository.readIds("cora", [foundryItem?.id ?? 0])).toEqual(new Set());
  });

  it("reports read ids in one call, treating own activity as read", () => {
    const { repository } = setupRepository();
    const items = repository.page({ spaceId: "riverside", kind: null, beforeId: null, limit: 50 }).items;
    const own = items.find((item) => item.actor.id === "cora");

    expect(
      repository.readIds(
        "cora",
        items.map((item) => item.id),
      ),
    ).toEqual(new Set([own?.id]));
    expect(repository.readIds("cora", [])).toEqual(new Set());
  });

  it("marks everything read and is idempotent", () => {
    const { repository } = setupRepository();
    repository.markAllRead("cora", "riverside");
    repository.markAllRead("cora", "riverside");
    repository.markRead("cora", "riverside", []);

    expect(repository.unreadCount("cora", "riverside")).toBe(0);
    expect(repository.unreadCount("ada", "riverside")).toBe(3);
  });

  it("the database rejects empty or oversized summaries and unknown kinds", () => {
    const { repository } = setupRepository();
    expect(() =>
      repository.addActivity({ spaceId: "riverside", actorId: "ada", kind: "booking", summary: "" }),
    ).toThrow();
    expect(() =>
      repository.addActivity({ spaceId: "riverside", actorId: "ada", kind: "booking", summary: "x".repeat(281) }),
    ).toThrow();
    expect(() =>
      repository.addActivity({ spaceId: "riverside", actorId: "ada", kind: "party" as never, summary: "x" }),
    ).toThrow();
  });

  it("looks up people, roles, and memberships", () => {
    const { repository } = setupRepository();
    expect(repository.roleIn("ben", "riverside")).toBe("staff");
    expect(repository.roleIn("ben", "foundry")).toBeNull();
    expect(repository.membershipsOf("ada").map((membership) => membership.spaceName)).toEqual([
      "Foundry Lane Workshop",
      "Riverside Makers",
    ]);
    expect(repository.findPerson("nobody")).toBeUndefined();
    expect(repository.listPeople()).toHaveLength(5);
  });
});
