import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";

// Environnements où Chromium est préinstallé hors du cache Playwright
// (ex. sandbox distant, poste avec une autre version en cache) : on pointe
// directement sur le binaire, via PLAYWRIGHT_CHROMIUM_PATH ou /opt/pw-browsers.
const candidates = [
  process.env.PLAYWRIGHT_CHROMIUM_PATH,
  "/opt/pw-browsers/chromium",
].filter((p): p is string => !!p);
const executablePath = process.env.CI
  ? undefined
  : candidates.find((p) => fs.existsSync(p));

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], launchOptions: { executablePath } },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], launchOptions: { executablePath } },
    },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://postgres:postgres@localhost:5432/day",
      AUTH_SECRET: "e2e-secret-not-for-production",
      AUTH_GOOGLE_ID: "placeholder",
      AUTH_GOOGLE_SECRET: "placeholder",
      AUTH_TRUST_HOST: "true",
    },
  },
});
