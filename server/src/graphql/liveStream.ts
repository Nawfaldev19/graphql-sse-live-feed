import type { GraphQLError } from "graphql";
import { Repeater } from "graphql-yoga";

const MAX_TIMER_MS = 2 ** 31 - 1;

/** The last item a guarded stream yields before it ends; `resolve` turns it into a GraphQL error. */
export interface StreamClosed {
  closed: GraphQLError;
}

export const isStreamClosed = (value: unknown): value is StreamClosed =>
  typeof value === "object" && value !== null && "closed" in value;

interface GuardOptions {
  /** Epoch milliseconds after which the stream must stop (the token's `exp`). */
  expiresAt: number;
  expiredError: () => GraphQLError;
  /** Returns an error once the viewer may no longer see this stream, or null while access still holds. */
  checkAccess: () => GraphQLError | null;
  /** Access is checked before every event and also on this interval, so a quiet space still notices a removal. */
  recheckMs: number;
  now?: () => number;
}

/**
 * Wraps a PubSub stream so that it ends when the token expires or access is
 * revoked. A subscription is authorized once, at the start, but it can stay
 * open for hours; without this, a removed member or an expired token would
 * keep receiving events until the browser reconnected.
 */
export function guardStream<T>(source: AsyncIterable<T>, options: GuardOptions): AsyncIterable<T | StreamClosed> {
  const now = options.now ?? Date.now;

  return new Repeater<T | StreamClosed>(async (push, stop) => {
    const iterator = source[Symbol.asyncIterator]();
    let finished = false;
    // Read through a function: `finished` changes in timer callbacks, which control-flow narrowing cannot see.
    const isFinished = () => finished;

    const close = async (error: GraphQLError) => {
      if (finished) return;
      finished = true;
      await push({ closed: error });
      stop();
    };

    // setTimeout cannot wait longer than 2^31 - 1 ms, so a far-off expiry is reached in steps.
    let expiry: ReturnType<typeof setTimeout> | undefined;
    const armExpiry = () => {
      const remaining = options.expiresAt - now();
      if (remaining <= 0) void close(options.expiredError());
      else expiry = setTimeout(armExpiry, Math.min(remaining, MAX_TIMER_MS));
    };
    armExpiry();
    const recheck = setInterval(() => {
      const denied = options.checkAccess();
      if (denied) void close(denied);
    }, options.recheckMs);

    void stop.then(() => {
      finished = true;
      clearTimeout(expiry);
      clearInterval(recheck);
      void iterator.return?.();
    });

    while (!isFinished()) {
      const next = await iterator.next();
      if (next.done || isFinished()) break;
      if (now() >= options.expiresAt) {
        await close(options.expiredError());
        break;
      }
      const denied = options.checkAccess();
      if (denied) {
        await close(denied);
        break;
      }
      await push(next.value);
    }
    stop();
  });
}
