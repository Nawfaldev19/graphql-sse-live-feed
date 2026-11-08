# Testing

## Strategy

| Layer | Tool | What it proves |
|---|---|---|
| Server units | Vitest | Token signing, expiry at the exact boundary, forgery and malformed input; cursor round-trips and rejection of foreign cursors; config defaults, production refusal, and the placeholder secret; JSON logging; simulator behavior with a seeded random source and fake timers; the stream guard's closing item, long expiries, and cleanup on disconnect. |
| Repository | Vitest against in-memory SQLite | Keyset paging stays correct while items are inserted between pages; kind filters; unread counts excluding own activity; mark-read ignores other spaces' ids; database constraints. |
| API | Vitest calling `yoga.fetch` in memory | Every query and mutation over real HTTP semantics, including auth codes, validation codes, role checks, error masking, and **real SSE streams** for subscriptions. |
| Client units | Vitest | Cache merge helpers, relative time, session persistence, routing of subscriptions to the SSE transport. |
| Client components | Vitest + Testing Library + Apollo `MockedProvider` | Feed rendering, optimistic mark-read, filters, pushed items reaching every cached filter, the "new" button and its live announcement, the "live updates stopped" notice, empty and error states, announcement validation. |
| End to end | Playwright | Both apps against a fresh database with the simulator off; three simultaneous browser sessions prove live delivery to the right space only. |

## Isolation tests (the important ones)

- A member reading, counting, or marking another space gets `NOT_FOUND`, the same as for a space that does not exist.
- `markRead` with an id from another space changes nothing there.
- A subscriber to one space receives nothing when another space publishes (`api.test.ts`), and in the browser (`feed.spec.ts`) Theo never sees Ben's Riverside announcement.
- Subscribing to a space you are not in yields a `NOT_FOUND` error on the stream.
- An open stream ends with `FORBIDDEN` once the viewer is removed from the space, both on the next event and, for a quiet space, on the re-check timer; the removed viewer never receives the event.
- An open stream ends with `UNAUTHENTICATED` when its token expires, with no event needed to trigger it.

## Regression test for stale filters

`FeedPage.test.tsx` loads "Everything", switches to "Announcements", receives a pushed booking, and switches back. The booking must be first in the list, served from cache (there is deliberately no second "Everything" mock).

## Running

```bash
cd server && npm run test:coverage   # 51 tests
cd client && npm run test:coverage   # 41 tests
cd client && npm run test:e2e        # 3 Playwright tests
```

## Coverage (last run)

| Suite | Lines | Branches | Functions |
|---|---|---|---|
| Server | 99% | 94% | 98% |
| Client | 98% | 94% | 91% |

`server/src/main.ts` (process wiring) and `client/src/main.tsx` (React root and context setup) are excluded; both are exercised by every Playwright run.

## Known gaps

- **Reconnection is not tested automatically.** The SSE client retries on its own; no test kills the server mid-stream.
- **A few client branches are uncovered:** the "Load older" click handler, the fallback when mark-read fails, and the theme helper's storage branches.
- **Concurrency on the server is not tested.** better-sqlite3 is synchronous and Node is single-threaded, so writes are serialized within one process; multi-process deployment is out of scope (see ADR-002).
- **No load testing** of many simultaneous subscribers.
