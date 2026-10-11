import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

// By default QA tests the current checkout, not an unrelated live deployment.
// Set PLAYWRIGHT_BASE_URL=https://globalstocks.vercel.app to check production.
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim();
const baseURL = (externalBaseUrl || "http://127.0.0.1:3000").replace(/\/$/, "");

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }]
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 45_000
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } }
  ],
  webServer: externalBaseUrl ? undefined : {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
    cwd: resolve(__dirname, "apex-stock-os"),
    url: "http://127.0.0.1:3000/download",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { NEXT_TELEMETRY_DISABLED: "1" }
  }
});
