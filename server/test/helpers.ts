import { createApp } from "../src/app.js";
import { issueToken } from "../src/auth/tokens.js";
import { openDatabase } from "../src/db/database.js";
import { seedIfEmpty } from "../src/db/seed.js";
import { createLogger } from "../src/logger.js";

export const SECRET = "test-secret-that-is-long-enough-to-pass-validation";

export function setup(options: { membershipRecheckMs?: number } = {}) {
  const db = openDatabase(":memory:");
  seedIfEmpty(db, new Date("2031-03-10T12:00:00Z"));
  const app = createApp({
    db,
    tokenSecret: SECRET,
    logger: createLogger("silent"),
    corsOrigin: "http://localhost:5176",
    ...options,
  });

  // T lets each test state the response shape it expects.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  async function graphql<T = Record<string, unknown>>(
    query: string,
    variables: Record<string, unknown> = {},
    as?: string,
  ) {
    const response = await app.yoga.fetch("http://test/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(as ? { Authorization: `Bearer ${issueToken(as, SECRET)}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });
    return (await response.json()) as {
      data: T | null;
      errors?: { message: string; extensions?: { code?: string } }[];
    };
  }

  /** Opens an SSE subscription and returns a reader of `next` payloads. Pass `token` to use a specific one. */
  async function subscribe(
    query: string,
    variables: Record<string, unknown>,
    as: string,
    token = issueToken(as, SECRET),
  ) {
    const response = await app.yoga.fetch("http://test/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query, variables }),
    });
    const reader = (response.body as ReadableStream<Uint8Array>).getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let completed = false;

    async function nextEvent(timeoutMs = 1000): Promise<Record<string, unknown> | null> {
      const deadline = Date.now() + timeoutMs;
      for (;;) {
        const match = /event: (next|complete)\ndata: ?(.*)\n\n/.exec(buffer);
        if (match) {
          buffer = buffer.slice(match.index + match[0].length);
          if (match[1] === "complete") {
            completed = true;
            return null;
          }
          return JSON.parse(match[2] ?? "null") as Record<string, unknown>;
        }
        const remaining = deadline - Date.now();
        if (remaining <= 0) return null;
        const chunk = await Promise.race([
          reader.read(),
          new Promise<"timeout">((resolve) => {
            setTimeout(() => {
              resolve("timeout");
            }, remaining);
          }),
        ]);
        if (chunk === "timeout") return null;
        if (chunk.done) {
          completed = true;
          return null;
        }
        buffer += decoder.decode(chunk.value);
      }
    }

    // Wait for the stream to open (Yoga sends a comment line first), so publishes after this are delivered.
    await reader.read().then((chunk) => {
      if (chunk.value) buffer += decoder.decode(chunk.value);
    });
    return { nextEvent, completed: () => completed, close: () => reader.cancel() };
  }

  return { db, app, graphql, subscribe };
}
