import type { ActivityKind } from "../db/database.js";
import type { ActivityRecord, Repository } from "./repository.js";

const EQUIPMENT: Record<string, string[]> = {
  riverside: ["Laser cutter (60 W)", "CNC router", "Wood lathe", "FDM printer A", "Resin printer", "Sewing machine"],
  foundry: ["Pottery kiln", "Pottery wheel 1", "Metal lathe", "MIG welder", "Vinyl cutter"],
};
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIMES = ["09:00", "10:30", "13:00", "15:15", "18:00", "19:30"];

/** Deterministic when given a seeded `random`, which the tests use. */
export function makeEvent(spaceId: string, random: () => number): { kind: ActivityKind; summary: string } {
  const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)] as T;
  const item = pick(EQUIPMENT[spaceId] ?? ["a workbench"]);
  if (random() < 0.8) return { kind: "booking", summary: `Booked the ${item} for ${pick(DAYS)} ${pick(TIMES)}.` };
  return { kind: "equipment", summary: `Marked the ${item} as back in service.` };
}

interface SimulatorOptions {
  repository: Repository;
  publish: (activity: ActivityRecord) => void;
  intervalMs: number;
  random?: () => number;
}

/**
 * Demo mode: every interval, a random member of a random space books something,
 * through the same repository and publish path as real mutations.
 */
export function startSimulator({
  repository,
  publish,
  intervalMs,
  random = Math.random,
}: SimulatorOptions): () => void {
  const timer = setInterval(() => {
    const people = repository.listPeople();
    const person = people[Math.floor(random() * people.length)];
    if (!person) return;
    const spaces = repository.membershipsOf(person.id);
    const space = spaces[Math.floor(random() * spaces.length)];
    if (!space) return;
    const event = makeEvent(space.spaceId, random);
    publish(repository.addActivity({ spaceId: space.spaceId, actorId: person.id, ...event }));
  }, intervalMs);
  return () => {
    clearInterval(timer);
  };
}
