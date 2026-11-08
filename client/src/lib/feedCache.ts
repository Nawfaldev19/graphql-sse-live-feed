// Pure helpers for keeping the cached feed consistent when items arrive from
// two directions: older pages (fetchMore) and live pushes (subscription).

export interface HasId {
  id: string;
}

/** Appends an older page, skipping anything already present. */
export function appendPage<T extends HasId>(existing: readonly T[], incoming: readonly T[]): T[] {
  const seen = new Set(existing.map((item) => item.id));
  return [...existing, ...incoming.filter((item) => !seen.has(item.id))];
}

/** Puts a live item at the top unless it is already there (a refetch may have raced the push). */
export function prependLive<T extends HasId>(existing: readonly T[], item: T): T[] {
  return existing.some((current) => current.id === item.id) ? [...existing] : [item, ...existing];
}
