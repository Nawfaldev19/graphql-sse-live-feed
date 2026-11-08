// Opaque keyset cursor. Clients must not parse it; the server can change the
// encoding without breaking them.
const PREFIX = "a:";

export function encodeCursor(activityId: number): string {
  return Buffer.from(`${PREFIX}${activityId}`).toString("base64url");
}

/** Returns the activity id, or null if the cursor was not produced by encodeCursor. */
export function decodeCursor(cursor: string): number | null {
  const decoded = Buffer.from(cursor, "base64url").toString();
  if (!decoded.startsWith(PREFIX)) return null;
  const id = Number(decoded.slice(PREFIX.length));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
