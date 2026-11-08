# Security

## Assets

Each space's activity and each person's read state.

## Threats and mitigations

| Threat | Mitigation | Where |
|---|---|---|
| Reading another space's feed by guessing its id | `requireMember` on every resolver; non-members get `NOT_FOUND`, indistinguishable from a missing space. | `graphql/context.ts` |
| Subscribing to another space's live events | Membership is checked before the stream starts; the PubSub topic is keyed by space, so a stream can only carry its own space's events. | `Subscription.activityAdded` |
| Keeping a stream after losing access | Membership is re-checked before every event and every 30 seconds; the stream also closes at the token's expiry. Each case ends with a coded error and `complete`. | `graphql/liveStream.ts` |
| Marking another space's items read | `markRead` joins ids against the requested space in SQL. | `repository.markRead` |
| A member posting announcements | `requireManager` (owner or staff). | `Mutation.postAnnouncement` |
| Forged or tampered tokens | HMAC-SHA256 signature compared with `timingSafeEqual`; expiry checked; malformed input rejected. | `auth/tokens.ts` |
| Running production with a guessable secret | Startup fails in production without a 32+ character `TOKEN_SECRET`, and the placeholder value from `.env.example` is rejected by name. | `config.ts` |
| Oversized or malformed input | GraphQL types first, then zod: page size ≤ 50, at most 100 ids, numeric ids, message 1–280 characters after trimming; database check constraints as a backstop. | `resolvers.ts`, `db/database.ts` |
| SQL injection | Prepared statements with bound parameters everywhere; dynamic `IN (...)` lists are built from placeholders only. | `repository.ts` |
| Leaking internals in errors | Yoga masks unexpected errors as "Unexpected error."; only deliberate coded errors pass through (tested). | `app.ts`, `graphql/errors.ts` |
| Cross-site request forgery | Not applicable: authentication is a bearer header, never a cookie, so a third-party page cannot make authenticated requests. CORS allows only the configured web origin. | `app.ts` |
| Script injection in the feed | React renders summaries as text; no HTML rendering anywhere. | `ActivityItem.tsx` |

## Known limitations

- **Demo identities have no passwords** (see [ADR-008](DECISIONS.md#adr-008-demo-identities-without-passwords)). Do not deploy this publicly with real data.
- **Tokens live in `localStorage`** and cannot be revoked before their 12-hour expiry (open streams do end at that expiry).
- **Removal from a space reaches an open subscription by polling:** on the next event or within 30 seconds (see [ADR-005](DECISIONS.md#adr-005-access-re-checked-while-a-stream-is-open)).
- **No rate limiting** on posting or subscribing.
