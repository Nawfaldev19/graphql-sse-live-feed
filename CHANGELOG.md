# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-10-21

### Fixed

- Switching filters no longer shows a stale list: a pushed item is written into every cached filter that would list it, and "Mark all read" updates every cached filter.
- Live subscriptions now end when the token expires or the viewer is removed from the space, with a coded error, instead of running until the browser reconnects.
- Production refuses the placeholder `TOKEN_SECRET` from `.env.example`.

### Changed

- The client shows "Live updates stopped" when the server ends a stream, and signs out when the stream ends with `UNAUTHENTICATED`.
- The server container runs compiled JavaScript; `tsx` is now a development dependency.
- Long SQL statements are split over several lines.

### Added

- Prettier (120 columns) for server and client, with `format` and `format:check` scripts and a CI check.

## [1.0.0] - 2026-10-17

### Added

- TypeScript GraphQL server (GraphQL Yoga) with SQLite storage, signed demo tokens, membership and role checks, validated inputs, coded errors, and structured logs.
- Activity feed with kind filters, keyset pagination, per-person read state, and announcements.
- Live updates through GraphQL subscriptions over Server-Sent Events, with one topic per space.
- Demo simulator that posts plausible bookings at a fixed interval.
- React client with an SSE subscription link, optimistic read state, a "new updates" button with a live-region announcement, space switching, and light and dark themes.
- Unit, API (including real SSE streams), component, and multi-browser end-to-end tests; one-command start; Docker Compose; GitHub Actions CI.
