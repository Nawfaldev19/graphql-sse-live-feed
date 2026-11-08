import { openDatabase } from "../src/db/database.js";
import { seedIfEmpty } from "../src/db/seed.js";
import { makeEvent, startSimulator } from "../src/feed/simulator.js";
import { createRepository, type ActivityRecord } from "../src/feed/repository.js";

const sequence = (...values: number[]) => {
  let index = 0;
  return () => values[index++ % values.length] ?? 0;
};

describe("simulator", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("makes bookings most of the time and equipment updates otherwise", () => {
    expect(makeEvent("riverside", sequence(0, 0.1, 0, 0))).toEqual({
      kind: "booking",
      summary: "Booked the Laser cutter (60 W) for Monday 09:00.",
    });
    expect(makeEvent("foundry", sequence(0, 0.9))).toEqual({
      kind: "equipment",
      summary: "Marked the Pottery kiln as back in service.",
    });
    expect(makeEvent("unknown", sequence(0, 0.9)).summary).toBe("Marked the a workbench as back in service.");
  });

  it("stores and publishes an event per interval, only in a space the actor belongs to, until stopped", () => {
    vi.useFakeTimers();
    const db = openDatabase(":memory:");
    seedIfEmpty(db);
    const repository = createRepository(db);
    const published: ActivityRecord[] = [];
    const stop = startSimulator({ repository, publish: (record) => published.push(record), intervalMs: 1000 });

    vi.advanceTimersByTime(3000);
    stop();
    vi.advanceTimersByTime(3000);

    expect(published).toHaveLength(3);
    for (const record of published) expect(repository.roleIn(record.actor.id, record.spaceId)).not.toBeNull();
  });

  it("does nothing when there is nobody to act", () => {
    vi.useFakeTimers();
    const db = openDatabase(":memory:");
    const published: unknown[] = [];
    const stop = startSimulator({
      repository: createRepository(db),
      publish: (record) => published.push(record),
      intervalMs: 1000,
    });
    vi.advanceTimersByTime(2000);
    stop();
    expect(published).toHaveLength(0);
  });
});
