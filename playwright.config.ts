import path from "node:path"
import { defineConfig, devices } from "@playwright/test"

const PORT = process.env.DEV_PORT ?? "3000"
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`
const AUTH_DIR = path.join(__dirname, "tests", "e2e", ".auth")

/**
 * E2E config for Evoca. Targets the running dev server (v0 manages it), and
 * falls back to starting one locally via `reuseExistingServer`.
 *
 * Auth model: a `setup` project signs in each seeded dev account once and saves
 * its storage state under tests/e2e/.auth/. Authenticated test projects reuse
 * that state (no live login per test), which avoids the magic-link token race
 * that occurs when many parallel workers hit /api/dev-login for the same email.
 *
 * Naming convention drives which project a test runs in:
 *   - *.public.spec.ts / public.spec.ts  → no auth
 *   - *.authed.spec.ts                    → organizer-live session
 *   - *.live.spec.ts                      → organizer-live session
 *   - dashboard.spec.ts                   → handles its own auth needs (free + org)
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
    // 1. Authenticate all seeded accounts once, serially.
    { name: "setup", testMatch: /auth\.setup\.ts/ },

    // 2. Public, unauthenticated surfaces.
    {
      name: "public",
      testMatch: /(^|\/)(public|features-public)\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },

    // 3. Authenticated organizer surfaces (reuse organizer-live state).
    {
      name: "authed",
      testMatch: /(features-authed|features-live)\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join(AUTH_DIR, "organizer-live.json"),
      },
      dependencies: ["setup"],
    },

    // 4. Dashboard nav + paywall (manages its own per-account state).
    {
      name: "dashboard",
      testMatch: /dashboard\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
