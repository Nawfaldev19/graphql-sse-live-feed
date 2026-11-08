import { defineConfig, devices } from "@playwright/test";

const API_PORT = 4100;
const WEB_PORT = 5177;

// Starts the API on a fresh database with the simulator off, so every event in
// a test is one the test caused.
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://localhost:${WEB_PORT}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "cd ../server && rm -f data/e2e.sqlite3* && npx tsx src/main.ts",
      url: `http://localhost:${API_PORT}/graphql?query=%7B__typename%7D`,
      env: {
        PORT: String(API_PORT),
        DATABASE_PATH: "data/e2e.sqlite3",
        SIMULATOR: "off",
        CORS_ORIGIN: `http://localhost:${WEB_PORT}`,
        LOG_LEVEL: "warn",
      },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { VITE_API_URL: `http://localhost:${API_PORT}/graphql` },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
