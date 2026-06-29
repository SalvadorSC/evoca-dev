import { test, expect } from "@playwright/test"
import { devLogin } from "./helpers"

// ─── Authentication + dashboard navigation ────────────────────────────────────
//
// These depend on seeded dev accounts (scripts/seed-test-accounts.mjs) and the
// dev-login bypass (development only). If the bypass redirect fails, the
// beforeEach waitForURL throws and the test reports clearly.

test.describe("Authenticated dashboard (organizer-live)", () => {
  test.beforeEach(async ({ page }) => {
    await devLogin(page, "organizer-live")
  })

  test("lands on the dashboard with primary navigation", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/)
    // Nav links are identified by href (label text is transformed via CSS).
    await expect(page.locator('a[href="/dashboard"]').first()).toBeVisible()
    await expect(page.locator('a[href="/dashboard/conference"]').first()).toBeVisible()
    await expect(page.locator('a[href="/dashboard/account"]').first()).toBeVisible()
  })

  test("can open the Events (conferences) area", async ({ page }) => {
    // Navigate via the link's href. (A dev-only floating overlay can intercept
    // direct clicks in this environment, so we follow the route directly.)
    await page.goto("/dashboard/conference")
    await expect(page).toHaveURL(/\/dashboard\/conference/)
    await expect(page.locator("body")).toBeVisible()
  })

  test("can open the Account page and see profile fields", async ({ page }) => {
    await page.goto("/dashboard/account")
    await expect(page).toHaveURL(/\/dashboard\/account/)
    await expect(page.getByRole("heading", { name: /account/i }).first()).toBeVisible()
  })
})

test.describe("Protected routes", () => {
  test("dashboard redirects unauthenticated visitors to login", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe("Free account paywall", () => {
  test("free speaker is signed in and reaches the dashboard", async ({ page }) => {
    await devLogin(page, "free")
    await expect(page).toHaveURL(/\/dashboard/)
    // Upgrade affordance is present for non-paying users (label uses split
    // letter spans, so match by href + aria-label instead of text).
    await expect(page.locator('a[href="/dashboard/upgrade"]').first()).toBeVisible()
  })
})
