import { defineConfig, devices } from "@playwright/test"

const PORT = process.env.DEV_PORT ?? "3000"
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`

/**
 * E2E config for Evoca. Targets the running dev server (v0 manages it), and
 * falls back to starting one locally via `reuseExistingServer`.
 *
 * Dev-login (/api/dev-login) only works when NODE_ENV=development, which the
 * dev server provides — so the auth flows below depend on that.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
