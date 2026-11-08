import { createPubSub, createSchema, createYoga, type Plugin } from "graphql-yoga";
import type { Db } from "./db/database.js";
import { createRepository } from "./feed/repository.js";
import { buildContext, type ActivityPubSub, type AppServices, type GraphQLContext } from "./graphql/context.js";
import { resolvers } from "./graphql/resolvers.js";
import { typeDefs } from "./graphql/typeDefs.js";
import type { Logger } from "./logger.js";

export const schema = createSchema<GraphQLContext>({ typeDefs, resolvers });

interface AppOptions {
  db: Db;
  tokenSecret: string;
  logger: Logger;
  corsOrigin: string;
  /** Defaults to 30 seconds; tests shorten it. */
  membershipRecheckMs?: number;
}

/** Logs one structured line per executed operation. */
function timingPlugin(logger: Logger): Plugin {
  return {
    onExecute: ({ args }) => {
      const started = performance.now();
      return {
        onExecuteDone: () => {
          logger.info("graphql.execute", {
            operation: args.operationName ?? null,
            durationMs: Math.round(performance.now() - started),
          });
        },
      };
    },
  };
}

/** Wires the GraphQL server. Kept free of process-level concerns so tests can run it in memory. */
export function createApp({ db, tokenSecret, logger, corsOrigin, membershipRecheckMs = 30_000 }: AppOptions) {
  const pubSub: ActivityPubSub = createPubSub();
  const services: AppServices = { repository: createRepository(db), pubSub, tokenSecret, logger, membershipRecheckMs };

  const yoga = createYoga<{ request: Request }, GraphQLContext>({
    schema,
    graphqlEndpoint: "/graphql",
    cors: {
      origin: corsOrigin,
      credentials: false,
      methods: ["GET", "POST"],
      allowedHeaders: ["Authorization", "Content-Type", "Accept"],
    },
    // Unexpected errors reach clients as "Unexpected error."; coded GraphQLErrors pass through.
    maskedErrors: true,
    graphiql: false,
    logging: false,
    context: ({ request }) => buildContext(services, request.headers.get("authorization")),
    plugins: [timingPlugin(logger)],
  });

  const publish = (record: Parameters<ActivityPubSub["publish"]>[2]) => {
    pubSub.publish("activity:added", record.spaceId, record);
  };
  return { yoga, services, publish };
}
