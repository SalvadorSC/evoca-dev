import { test, expect } from "@playwright/test"
import { statePath } from "./helpers"

// ─── Authentication + dashboard navigation ────────────────────────────────────
//
// Auth comes from pre-saved storage state (auth.setup.ts), so no test performs
// a live login. This avoids the dev-login magic-link token race under parallel
// workers.

test.describe("Authenticated dashboard (organizer-live)", () => {
  test.use({ storageState: statePath("organizer-live") })

  test("lands on the dashboard with primary navigation", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/dashboard/)
    // Nav links are identified by href (label text is transformed via CSS).
    await expect(page.locator('a[href="/dashboard"]').first()).toBeVisible()
    await expect(page.locator('a[href="/dashboard/conference"]').first()).toBeVisible()
    await expect(page.locator('a[href="/dashboard/account"]').first()).toBeVisible()
  })

  test("can open the Events (conferences) area", async ({ page }) => {
    await page.goto("/dashboard/conference")
    await expect(page).toHaveURL(/\/dashboard\/conference/)
    await expect(page.locator("main, nav, h1, h2").first()).toBeVisible({ timeout: 15_000 })
  })

  test("can open the Account page and see profile fields", async ({ page }) => {
    await page.goto("/dashboard/account")
    await expect(page).toHaveURL(/\/dashboard\/account/)
    await expect(page.getByRole("heading", { name: /account/i }).first()).toBeVisible()
  })
})

test.describe("Protected routes", () => {
  // Explicitly no auth state for this block.
  test.use({ storageState: { cookies: [], origins: [] } })

  test("dashboard redirects unauthenticated visitors to login", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe("Free account paywall", () => {
  test.use({ storageState: statePath("free") })

  test("free speaker is signed in and reaches the dashboard", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/dashboard/)
    // Upgrade affordance is present for non-paying users (label uses split
    // letter spans, so match by href instead of text).
    await expect(page.locator('a[href="/dashboard/upgrade"]').first()).toBeVisible()
  })
})
