# Architecture decision records

## ADR-001: Server-Sent Events instead of WebSockets

**Context.** The feed only needs server-to-client pushes. Clients send everything else (mark read, post) as normal requests.

**Decision.** Subscriptions run over SSE using the graphql-sse protocol, which GraphQL Yoga supports out of the box.

**Consequences.** Plain HTTP: standard headers carry the bearer token, proxies and load balancers handle it like any request, and the browser-side client reconnects automatically. Each subscription is its own HTTP connection; under HTTP/1.1 browsers allow about six per origin, which is fine for one feed per tab. HTTP/2 removes that limit.

## ADR-002: In-memory PubSub

**Context.** Yoga's PubSub can be backed by memory or by an external broker such as Redis.

**Decision.** Use the in-memory implementation, with typed topics keyed by space id.

**Consequences.** No extra infrastructure. Only clients connected to the same process receive events, so the app cannot be scaled horizontally as is. Swapping in a Redis-backed event target is a configuration change in `app.ts`; resolvers do not change.

## ADR-003: Keyset pagination on the activity id

**Context.** Offset pagination breaks for a live feed: when new items arrive at the top, every later page shifts, and the reader sees duplicates.

**Decision.** Pages are fetched with `WHERE id < :cursor ORDER BY id DESC`. The cursor is an opaque, prefixed, base64url encoding of the last id.

**Consequences.** Pages are stable under inserts and cost the same at any depth. Because `id` is assigned at insert time, it matches creation order; a feed that could be backdated would need a composite `(created_at, id)` key instead.

## ADR-004: Per-item read rows

**Context.** Read state can be stored per item (one row per person per activity) or as a "last read" watermark per person per space.

**Decision.** Per-item rows.

**Consequences.** People can read items out of order, which matches how a feed is used. Storage grows with people × activities; for a large network a watermark plus a small set of exceptions would be cheaper. Own activity is treated as read without storing rows.

## ADR-005: Access re-checked while a stream is open

**Context.** A subscription can stay open for hours. Checking membership only in `subscribe` meant a person removed from a space kept receiving its events, and an expired token kept working, until the browser reconnected.

**Decision.** Wrap the PubSub stream in `guardStream`. Before each event it looks up the viewer's membership again (one primary-key read) and compares the clock with the token's `exp`. A 30-second timer repeats the membership check, and a second timer fires at `exp`, so a quiet space is covered too. When a check fails, the stream sends one last payload with a coded error (`FORBIDDEN` for removal, `UNAUTHENTICATED` for expiry) and completes.

**Consequences.** One indexed lookup per event per subscriber, which is cheap next to the SSE write itself. Removal takes effect on the next event or within 30 seconds. A push-based alternative (publish membership changes and close matching streams at once) is better at scale but needs an event source this demo does not have.

## ADR-006: Optimistic read state with server reconciliation

**Context.** Marking an item read should feel instant, but the unread count must end up correct even if another tab or a new event changed it meanwhile.

**Decision.** The client updates the item and decrements the count immediately, then replaces the count with the value the server returns. On failure it refetches.

**Consequences.** Instant feedback and eventual correctness. Until the server replies, the count is a guess.

## ADR-007: Coded errors created through Yoga

**Context.** Yoga masks unexpected errors as "Unexpected error." and passes through `GraphQLError` instances. In this setup two copies of `graphql` can load (ES module and CommonJS builds), so an error created from one copy is not recognized by the other and gets masked.

**Decision.** Build coded errors with Yoga's `createGraphQLError`.

**Consequences.** `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, and `BAD_USER_INPUT` reach clients reliably; anything else stays masked. A test proves both behaviors.

## ADR-008: Demo identities without passwords

**Context.** The feature being shown is real-time delivery and authorization, not credential handling (the reservations demo covers password sign-in).

**Decision.** Visitors pick a person; the server issues a real signed token for them.

**Consequences.** Frictionless demo. Everything after sign-in (token verification, membership and role checks) is production-shaped.

## ADR-009: Live items update every cached filter

**Context.** Apollo keeps one cache entry per `{spaceId, kind}`. Writing a pushed item only into the entry on screen left the others stale: on "Announcements", a new booking raised the unread count, but switching to "Everything" served the old list from cache.

**Decision.** On each push, write the item into every cached filter that would list it ("Everything" and the item's own kind) and bump the shared unread count once. Filters that were never loaded are skipped. "Mark all read" likewise updates items in every cached filter.

**Consequences.** There are only five filters, so the extra writes are trivial, and loaded older pages survive. I preferred this to evicting the other entries, which is simpler but costs a refetch and throws away pages the reader already loaded.
