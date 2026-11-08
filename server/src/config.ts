import { randomBytes } from "node:crypto";
import { z } from "zod";

// The value shipped in .env.example. It is long enough to pass the length check,
// so it is rejected by name: copying the example file must not yield forgeable tokens.
export const PLACEHOLDER_SECRET = "replace-with-a-long-random-string";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  DATABASE_PATH: z.string().min(1).default("data/activity.sqlite3"),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:5176"),
  TOKEN_SECRET: z
    .string()
    .min(32)
    .refine((value) => value !== PLACEHOLDER_SECRET, "TOKEN_SECRET is still the placeholder from .env.example")
    .optional(),
  SIMULATOR: z.enum(["on", "off"]).default("on"),
  SIMULATOR_INTERVAL_MS: z.coerce.number().int().min(500).default(6000),
});

export interface Config {
  port: number;
  databasePath: string;
  corsOrigin: string;
  tokenSecret: string;
  /** True when no TOKEN_SECRET was supplied and a random one was generated for this process. */
  ephemeralSecret: boolean;
  simulator: { enabled: boolean; intervalMs: number };
}

/** Parses environment variables. Production refuses to start without a real secret. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.parse(env);
  if (parsed.NODE_ENV === "production" && !parsed.TOKEN_SECRET) {
    throw new Error("TOKEN_SECRET (32+ characters) is required in production");
  }
  return {
    port: parsed.PORT,
    databasePath: parsed.DATABASE_PATH,
    corsOrigin: parsed.CORS_ORIGIN,
    tokenSecret: parsed.TOKEN_SECRET ?? randomBytes(32).toString("hex"),
    ephemeralSecret: !parsed.TOKEN_SECRET,
    simulator: { enabled: parsed.SIMULATOR === "on", intervalMs: parsed.SIMULATOR_INTERVAL_MS },
  };
}
