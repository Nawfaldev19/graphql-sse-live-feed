import { createServer } from "node:http";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { openDatabase } from "./db/database.js";
import { seedIfEmpty } from "./db/seed.js";
import { startSimulator } from "./feed/simulator.js";
import { createLogger } from "./logger.js";

const logger = createLogger();
const config = loadConfig();
if (config.ephemeralSecret)
  logger.warn("config.ephemeral_token_secret", { note: "TOKEN_SECRET not set; tokens reset on restart" });

const db = openDatabase(config.databasePath);
if (seedIfEmpty(db)) logger.info("db.seeded", { path: config.databasePath });

const app = createApp({ db, tokenSecret: config.tokenSecret, logger, corsOrigin: config.corsOrigin });
const stopSimulator = config.simulator.enabled
  ? startSimulator({
      repository: app.services.repository,
      publish: app.publish,
      intervalMs: config.simulator.intervalMs,
    })
  : () => undefined;

// Yoga handles its own errors; the returned promise is intentionally not awaited by Node.
const server = createServer((request, response) => {
  void app.yoga(request, response);
});
server.listen(config.port, () => {
  logger.info("server.started", {
    url: `http://localhost:${config.port}/graphql`,
    simulator: config.simulator.enabled,
  });
});

const shutdown = () => {
  stopSimulator();
  server.close(() => {
    db.close();
    process.exit(0);
  });
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
