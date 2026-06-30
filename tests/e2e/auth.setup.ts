import fs from "node:fs"
import { test as setup, expect } from "@playwright/test"
import { ACCOUNTS, AUTH_DIR, devLogin, statePath } from "./helpers"

/**
 * Authentication setup project.
 *
 * Runs once before the test projects. It signs in each seeded dev account
 * sequentially (NOT in parallel — the dev-login magic-link flow invalidates a
 * previous token when a new one is minted for the same email) and persists the
 * resulting browser storage state to tests/e2e/.auth/<account>.json.
 *
 * The chromium test project then reuses these states via `storageState`, so no
 * test performs a live login and there is no cross-test auth race.
 */
setup("authenticate seeded accounts", async ({ browser }) => {
  fs.mkdirSync(AUTH_DIR, { recursive: true })

  for (const account of ACCOUNTS) {
    const context = await browser.newContext()
    const page = await context.newPage()
    await devLogin(page, account)
    await expect(page).toHaveURL(/\/dashboard/)
    await context.storageState({ path: statePath(account) })
    await context.close()
  }
})
