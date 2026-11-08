# Third-party notices

This project's own code is MIT licensed (see [LICENSE](LICENSE)). Dependencies are installed by npm, not copied into the repository. Only permissively licensed packages are used.

## Server (`server/package.json`)

| Package | License | Purpose |
|---|---|---|
| graphql-yoga | MIT | GraphQL server with SSE subscriptions |
| graphql | MIT | GraphQL implementation |
| better-sqlite3 | MIT | SQLite driver |
| zod | MIT | Runtime validation |
| tsx | MIT | Runs TypeScript directly (development) |
| typescript | Apache-2.0 | Type checking and compilation (development) |
| vitest, @vitest/coverage-v8 | MIT | Tests (development) |
| eslint, @eslint/js, typescript-eslint, globals | MIT | Linting (development) |
| prettier | MIT | Code formatting (development) |
| @types/node, @types/better-sqlite3 | MIT | Type definitions (development) |

Two transitive packages pulled in by better-sqlite3's install step offer a choice of licenses and are used under MIT: `expand-template` (MIT or WTFPL) and `rc` (BSD-2-Clause, MIT, or Apache-2.0). All other transitive packages are MIT, ISC, Apache-2.0, BSD-2/3-Clause, BlueOak-1.0.0, or 0BSD.

## Client (`client/package.json`)

| Package | License | Purpose |
|---|---|---|
| react, react-dom | MIT | UI library |
| @apollo/client | MIT | GraphQL client and cache |
| graphql | MIT | GraphQL parsing |
| graphql-sse | MIT | Subscriptions over Server-Sent Events |
| lucide-react | ISC | Icons |
| vite, @vitejs/plugin-react | MIT | Dev server and build |
| typescript | Apache-2.0 | Type checking |
| @graphql-codegen/cli, @graphql-codegen/client-preset | MIT | Type generation |
| eslint, @eslint/js, typescript-eslint, eslint-plugin-react-hooks, globals | MIT | Linting |
| prettier | MIT | Code formatting |
| vitest, @vitest/coverage-v8, jsdom | MIT | Unit and component tests |
| @testing-library/react, @testing-library/user-event, @testing-library/jest-dom | MIT | Component testing |
| @playwright/test | Apache-2.0 | End-to-end tests |
| @types/react, @types/react-dom, @types/node | MIT | Type definitions |

Transitive client dependencies are MIT, ISC, Apache-2.0, BSD-2/3-Clause, 0BSD, MIT-0, CC0-1.0, BlueOak-1.0.0, or Python-2.0, plus the browser-support dataset `caniuse-lite` (CC-BY-4.0), used by build tooling only.

## Fonts

Loaded from Google Fonts at runtime; not redistributed.

| Font | License |
|---|---|
| Fraunces | SIL Open Font License 1.1 |
| Inter | SIL Open Font License 1.1 |
| JetBrains Mono | SIL Open Font License 1.1 |

## Icons and images

- Icons: Lucide (ISC).
- The favicon (`client/public/favicon.svg`) is original artwork made for this project.
