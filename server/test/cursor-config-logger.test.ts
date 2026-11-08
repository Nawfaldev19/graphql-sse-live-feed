import { loadConfig, PLACEHOLDER_SECRET } from "../src/config.js";
import { decodeCursor, encodeCursor } from "../src/feed/cursor.js";
import { createLogger } from "../src/logger.js";

describe("cursor", () => {
  it("round-trips ids and is opaque", () => {
    const cursor = encodeCursor(42);
    expect(cursor).not.toContain("42");
    expect(decodeCursor(cursor)).toBe(42);
  });

  it.each([
    "",
    "garbage",
    Buffer.from("a:0").toString("base64url"),
    Buffer.from("a:-3").toString("base64url"),
    Buffer.from("b:5").toString("base64url"),
    Buffer.from("a:1.5").toString("base64url"),
  ])("rejects %j", (cursor) => {
    expect(decodeCursor(cursor)).toBeNull();
  });
});

describe("config", () => {
  it("applies defaults and generates an ephemeral secret in development", () => {
    const config = loadConfig({});
    expect(config.port).toBe(4000);
    expect(config.simulator).toEqual({ enabled: true, intervalMs: 6000 });
    expect(config.ephemeralSecret).toBe(true);
    expect(config.tokenSecret).toHaveLength(64);
  });

  it("uses provided values", () => {
    const config = loadConfig({ PORT: "5000", SIMULATOR: "off", TOKEN_SECRET: "s".repeat(32), DATABASE_PATH: "x.db" });
    expect(config).toMatchObject({
      port: 5000,
      databasePath: "x.db",
      ephemeralSecret: false,
      simulator: { enabled: false },
    });
  });

  it("refuses to start in production without a secret, and rejects short secrets", () => {
    expect(() => loadConfig({ NODE_ENV: "production" })).toThrow("TOKEN_SECRET");
    expect(() => loadConfig({ TOKEN_SECRET: "short" })).toThrow();
  });

  it("rejects the placeholder secret from .env.example", () => {
    expect(PLACEHOLDER_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(() => loadConfig({ NODE_ENV: "production", TOKEN_SECRET: PLACEHOLDER_SECRET })).toThrow("placeholder");
  });
});

describe("logger", () => {
  it("writes one JSON object per line at or above the minimum level", () => {
    const lines: string[] = [];
    const logger = createLogger("info", (line) => lines.push(line));

    logger.debug("hidden");
    logger.info("shown", { id: 1 });
    logger.error("also.shown");

    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0] ?? "")).toMatchObject({ level: "info", event: "shown", id: 1 });
  });
});
