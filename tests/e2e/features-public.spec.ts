import { test, expect } from "@playwright/test"
import { OPEN_CFP_SLUG } from "./helpers"

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

// ─── feat-020 — Pro waitlist email capture ────────────────────────────────────
//
// Drives the real waitlist form. Client-side validation is exercised against
// the actual app (no network). The success and duplicate branches are asserted
// by mocking /api/waitlist so we verify the UI handles each response state
// deterministically without writing to the production waitlist table.

test.describe("Pro waitlist (feat-020)", () => {
  async function openWaitlist(page: import("@playwright/test").Page) {
    await page.goto("/pricing")
    await page.getByRole("tab", { name: /for speakers/i }).click()
    const email = page.getByLabel(/email address for speaker pro waitlist/i)
    await expect(email).toBeVisible({ timeout: 15_000 })
    return email
  }

  test("rejects an empty email with an inline error (no request sent)", async ({ page }) => {
    let requested = false
    await page.route("**/api/waitlist", (route) => {
      requested = true
      return route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) })
    })

    // Submitting empty passes the native type=email constraint (the field isn't
    // `required`), so the component's own validation is what must reject it.
    const email = await openWaitlist(page)
    await expect(email).toHaveValue("")
    await page.getByRole("button", { name: /notify me/i }).click()

    await expect(page.getByText(/valid email address/i)).toBeVisible()
    expect(requested).toBe(false)
  })

  test("shows the success state after a valid submission", async ({ page }) => {
    await page.route("**/api/waitlist", (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) }),
    )

    const email = await openWaitlist(page)
    await email.fill("e2e-waitlist@example.com")
    await page.getByRole("button", { name: /notify me/i }).click()

    await expect(page.getByText(/you're on the list/i)).toBeVisible()
  })

  test("surfaces the duplicate-email message on a 409", async ({ page }) => {
    await page.route("**/api/waitlist", (route) =>
      route.fulfill({
        status: 409,
        body: JSON.stringify({ error: "This email is already on the waitlist." }),
      }),
    )

    const email = await openWaitlist(page)
    await email.fill("dupe@example.com")
    await page.getByRole("button", { name: /notify me/i }).click()

    await expect(page.getByText(/already on the waitlist/i)).toBeVisible()
  })
})

// ─── feat-021 — Call for Papers public submission ─────────────────────────────
//
// Drives the real public CFP form (seeded open CFP). Required-field validation
// runs against the actual app (no network); the success state is asserted with
// a mocked /api/cfp/submit so we don't insert proposals into the database.

test.describe("Call for Papers public submission (feat-021)", () => {
  test("a non-existent CFP slug returns 404", async ({ page }) => {
    const res = await page.goto("/cfp/this-cfp-does-not-exist-xyz")
    expect(res?.status()).toBe(404)
  })

  test("an open CFP renders the submission form", async ({ page }) => {
    await page.goto(`/cfp/${OPEN_CFP_SLUG}`)
    await expect(page.getByRole("button", { name: /submit proposal/i })).toBeVisible({
      timeout: 15_000,
    })
  })

  test("blocks submission with a validation error when required fields are empty", async ({
    page,
  }) => {
    let requested = false
    await page.route("**/api/cfp/submit", (route) => {
      requested = true
      return route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) })
    })

    await page.goto(`/cfp/${OPEN_CFP_SLUG}`)
    await page.getByRole("button", { name: /submit proposal/i }).click()

    // The first required field ("Your name") should be reported and no POST sent.
    await expect(page.getByText(/your name is required/i)).toBeVisible()
    expect(requested).toBe(false)
  })

  test("shows the confirmation state after a valid submission", async ({ page }) => {
    await page.route("**/api/cfp/submit", (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) }),
    )

    await page.goto(`/cfp/${OPEN_CFP_SLUG}`)
    await page.getByLabel(/your name/i).fill("Ada Lovelace")
    await page.getByLabel(/email/i).first().fill("ada@example.com")
    await page.getByLabel(/talk title/i).fill("Scaling realtime systems")
    await page.getByLabel(/abstract/i).fill("A deep dive into realtime architecture and scaling.")
    await page.getByRole("button", { name: /submit proposal/i }).click()

    await expect(page.getByText(/submission received/i)).toBeVisible()
  })
})
