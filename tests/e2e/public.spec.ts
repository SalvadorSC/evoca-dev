import { test, expect } from "@playwright/test"
import { PUBLIC_CONFERENCE_SLUG } from "./helpers"

// ─── Public surfaces (no authentication) ──────────────────────────────────────

test.describe("Public pages", () => {
  test("landing page loads with the Evoca brand and a call to action", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/evoca/i)
    // Brand wordmark appears somewhere on the page.
    await expect(page.getByText("EVOCA", { exact: false }).first()).toBeVisible()
    // The landing page is a role chooser with "Get started" CTAs (buttons).
    await expect(page.getByRole("button", { name: /get started/i }).first()).toBeVisible()
  })

  test("login page shows the magic-link form", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible()
    await expect(page.getByPlaceholder(/you@example\.com/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /send magic link/i })).toBeVisible()
  })

  test("login page exposes dev test accounts in development", async ({ page }) => {
    await page.goto("/login")
    // Dev bypass panel is rendered only when NODE_ENV=development.
    await expect(page.getByText(/dev only/i)).toBeVisible()
    await expect(page.getByRole("link", { name: /organizer \(live\)/i })).toBeVisible()
  })
})

// ─── Public conference page (Dailymotion streaming feature) ───────────────────

test.describe("Public conference page", () => {
  test("unknown slug returns a 404", async ({ page }) => {
    const res = await page.goto("/c/this-conference-does-not-exist")
    expect(res?.status()).toBe(404)
  })

  test("published conference renders stream, schedule and is live", async ({ page }) => {
    const res = await page.goto(`/c/${PUBLIC_CONFERENCE_SLUG}`)
    // If the seed has been cleared, skip rather than fail the suite.
    test.skip(res?.status() === 404, "Seeded public conference not present")

    // Live marker + conference title in the header.
    await expect(page.getByText("Live", { exact: false }).first()).toBeVisible()
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

    // Stream player iframe is embedded.
    await expect(page.locator("iframe").first()).toBeVisible()

    // Schedule section is present.
    await expect(page.getByRole("heading", { name: /schedule/i })).toBeVisible()

    // Footer attribution.
    await expect(page.getByText(/powered by evoca/i)).toBeVisible()
  })
})
