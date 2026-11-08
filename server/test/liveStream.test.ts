import { createGraphQLError, Repeater } from "graphql-yoga";
import { guardStream, isStreamClosed } from "../src/graphql/liveStream.js";

const expired = () => createGraphQLError("expired", { extensions: { code: "UNAUTHENTICATED" } });

/** A source that yields whatever the test pushes and records whether it was released. */
function controlledSource() {
  let pushValue: ((value: number) => Promise<unknown>) | undefined;
  let released = false;
  const source = new Repeater<number>(async (push, stop) => {
    pushValue = push;
    await stop;
    released = true;
  });
  // The source starts lazily, on the guard's first read, so wait a tick before pushing. The push is not
  // awaited: a Repeater push settles only when the consumer asks for the following value.
  const pushSoon = async (value: number) => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    void pushValue?.(value);
  };
  return { source, push: pushSoon, released: () => released };
}

const closedCode = (result: IteratorResult<unknown>) =>
  !result.done && isStreamClosed(result.value) ? result.value.closed.extensions.code : undefined;

describe("guardStream", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("passes events through while access holds, then yields one closing item and ends", async () => {
    let allowed = true;
    const { source, push, released } = controlledSource();
    const stream = guardStream(source, {
      expiresAt: Date.now() + 60_000,
      expiredError: expired,
      checkAccess: () => (allowed ? null : createGraphQLError("gone", { extensions: { code: "FORBIDDEN" } })),
      recheckMs: 60_000,
    })[Symbol.asyncIterator]();

    const first = stream.next();
    await push(1);
    expect(await first).toEqual({ done: false, value: 1 });

    allowed = false;
    const second = stream.next();
    await push(2);
    expect(closedCode(await second)).toBe("FORBIDDEN");
    expect(await stream.next()).toEqual({ done: true, value: undefined });
    expect(released()).toBe(true);
  });

  it("reaches an expiry beyond the longest setTimeout delay without closing early", async () => {
    vi.useFakeTimers();
    const start = Date.now();
    const { source } = controlledSource();
    const stream = guardStream(source, {
      expiresAt: start + 2 ** 31 + 5_000,
      expiredError: expired,
      checkAccess: () => null,
      recheckMs: 2 ** 30,
    })[Symbol.asyncIterator]();
    let settled = false;
    const next = stream.next().then((result) => {
      settled = true;
      return result;
    });

    await vi.advanceTimersByTimeAsync(2 ** 31 - 1);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(closedCode(await next)).toBe("UNAUTHENTICATED");
  });

  it("releases the source and its timers when the client goes away", async () => {
    const { source, released } = controlledSource();
    const stream = guardStream(source, {
      expiresAt: Date.now() + 60_000,
      expiredError: expired,
      checkAccess: () => null,
      recheckMs: 10,
    })[Symbol.asyncIterator]();
    void stream.next();

    await stream.return?.();
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(released()).toBe(true);
  });
});
