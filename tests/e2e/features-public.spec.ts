import { test, expect } from "@playwright/test"

/**
 * E2E coverage for public, unauthenticated features.
 *
 * Maps to testing-tracker features:
 *   feat-001  Homepage pop-up & hover reactions
 *   feat-002  Responsive homepage layout
 *   feat-011  Color mode (theme switcher)
 *   feat-020  Pro waitlist email capture
 *   feat-023  Dedicated pricing page
 *   feat-021  Call for Papers — public submission page (closed/negative state)
 *
 * These run without auth, so they're stable in CI. Flows that require a live
 * Stripe/PartyKit backend are smoke-tested (route + UI), not driven to a real
 * third-party completion.
 */

// ─── feat-001 / feat-002 — Homepage interactions & responsiveness ─────────────

test.describe("Homepage (feat-001, feat-002)", () => {
  test("renders the role chooser with interactive CTAs", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/evoca/i)
    const ctas = page.getByRole("button", { name: /get started/i })
    await expect(ctas.first()).toBeVisible()
    // Hover should not throw and the element stays interactive (reaction feature).
    await ctas.first().hover()
    await expect(ctas.first()).toBeEnabled()
  })

  test("is responsive: no horizontal overflow on a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/")
    // The document should not scroll horizontally if the layout is responsive.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    // Allow a 1px rounding tolerance.
    expect(overflow).toBeLessThanOrEqual(1)
  })

  test("renders without horizontal overflow on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/")
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })
})

// ─── feat-011 — Color mode (theme switcher) ───────────────────────────────────

test.describe("Theme switcher (feat-011)", () => {
  test("toggles the html theme class and persists the choice", async ({ page }) => {
    await page.goto("/pricing")
    const toggle = page.getByRole("button", { name: /switch to (light|dark) mode/i }).first()
    await expect(toggle).toBeVisible({ timeout: 15_000 })

    const htmlClassBefore = await page.locator("html").getAttribute("class")
    await toggle.click()
    // The theme class on <html> should change after toggling.
    await expect
      .poll(async () => page.locator("html").getAttribute("class"))
      .not.toBe(htmlClassBefore)

    // Persisted to localStorage by next-themes.
    const stored = await page.evaluate(() => localStorage.getItem("theme"))
    expect(stored === "light" || stored === "dark").toBeTruthy()
  })
})

// ─── feat-023 — Dedicated pricing page ────────────────────────────────────────

test.describe("Pricing page (feat-023)", () => {
  test("loads with the speaker/organizer audience toggle", async ({ page }) => {
    await page.goto("/pricing")
    // The audience switch is rendered as ARIA tabs ("For Speakers"/"For Organizers").
    await expect(page.getByRole("tab", { name: /for speakers/i })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole("tab", { name: /for organizers/i })).toBeVisible()
  })

  test("switching audience reveals organizer tiers", async ({ page }) => {
    await page.goto("/pricing")
    await page.getByRole("tab", { name: /for organizers/i }).click()
    // Organizer view shows live, currency-aware prices (a numeric/currency token).
    await expect(page.getByText(/€|\$|usd|eur/i).first()).toBeVisible()
  })

  test("speaker Pro is marked coming soon with a waitlist affordance", async ({ page }) => {
    await page.goto("/pricing")
    await page.getByRole("tab", { name: /for speakers/i }).click()
    await expect(page.getByText(/coming soon/i).first()).toBeVisible()
  })
})

// ─── feat-020 — Pro waitlist email capture (landing page) ─────────────────────

test.describe("Pro waitlist (feat-020)", () => {
  test("notify-me affordance is present on a pricing surface", async ({ page }) => {
    await page.goto("/pricing")
    await page.getByRole("tab", { name: /for speakers/i }).click()
    // The waitlist entry point ("Notify me") gates the not-yet-live Pro plan.
    await expect(page.getByText(/notify me/i).first()).toBeVisible()
  })
})

// ─── feat-021 — Call for Papers public page (negative path) ───────────────────

test.describe("Call for Papers public page (feat-021)", () => {
  test("a non-existent CFP slug returns 404", async ({ page }) => {
    const res = await page.goto("/cfp/this-cfp-does-not-exist-xyz")
    expect(res?.status()).toBe(404)
  })
})
