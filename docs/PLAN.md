# Scope

## Goal

Show a real-time feature end to end in TypeScript: authorized server pushes, pagination that stays correct while data changes, and client state that stays consistent when updates arrive from several directions.

## Stories

- **Member:** "I see what is happening in my space as it happens, without refreshing, and I can tell what I have not read yet."
- **Staff or owner:** "I can post an announcement and everyone in my space sees it immediately."
- **Person in two spaces:** "Switching spaces shows only that space's activity."

## In scope

Demo identities with signed tokens; feed with filters and keyset pagination; unread counts and mark read; announcements; live updates over SSE; a simulator for demo mode; light and dark themes.

## Out of scope

Real authentication, push notifications, email digests, multi-instance deployment, editing or deleting activity.

## Order of work

I built it from the data outwards, so that every layer had tests before anything depended on it:

1. **Server foundations:** config, logging, tokens, schema, seed. Everything else needs a validated config and a way to say who is calling.
2. **Feed data:** the repository, with keyset pages and read state. Paging under inserts is the part most likely to be subtly wrong, so it was tested against SQLite before any API existed.
3. **API:** schema, resolvers, guards, coded errors, and subscriptions, tested in memory over real HTTP and SSE.
4. **Client:** Apollo with an SSE link, then the screens, with component tests.
5. **Delivery:** end-to-end tests in several browsers, one-command start, Docker, CI, and these docs.

## When I called it finished

Formatting, lint, type check, unit, API, component, and end-to-end tests pass; coverage thresholds are met; `bin/dev` starts everything from a clean checkout.
