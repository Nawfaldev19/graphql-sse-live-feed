type Level = "debug" | "info" | "warn" | "error";
const ORDER: Record<Level | "silent", number> = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

export type Logger = Record<Level, (event: string, fields?: Record<string, unknown>) => void>;

/** One JSON object per line on stdout. LOG_LEVEL sets the minimum level ("silent" in tests). */
export function createLogger(
  minimum = (process.env.LOG_LEVEL ?? "info") as Level | "silent",
  write: (line: string) => void = (line) => process.stdout.write(line),
): Logger {
  const threshold = ORDER[minimum];
  const log =
    (level: Level) =>
    (event: string, fields: Record<string, unknown> = {}) => {
      if (ORDER[level] < threshold) return;
      write(`${JSON.stringify({ time: new Date().toISOString(), level, event, ...fields })}\n`);
    };
  return { debug: log("debug"), info: log("info"), warn: log("warn"), error: log("error") };
}
