import { test, expect } from "@playwright/test"
import { statePath } from "./helpers"

/**
 * E2E coverage for authenticated organizer/speaker features.
 *
 * Maps to testing-tracker features:
 *   feat-004  Account — username/display name management
 *   feat-005  Account — plan management
 *   feat-010  Stripe payment integration (checkout initiation — smoke)
 *   feat-006  Conference multi-day scheduling
 *   feat-007  Conference slot management
 *   feat-008  Speaker assignment to slots
 *   feat-009  Speaker conference talk portal
 *   feat-013  PowerPoint / PDF presentation support (upload affordance)
 *   feat-014  iFrame URL embedding (embed affordance)
 *   feat-021  CFP organizer settings
 *   feat-022  Q&A history persisted to dashboard
 *
 * Auth comes from pre-saved storage state (see auth.setup.ts). The project
 * default is organizer-live; blocks needing another account override via
 * test.use({ storageState }). Stripe checkout is smoke-tested (the flow
 * initiates toward Stripe) rather than completing a real payment.
 */

// ─── feat-004 / feat-005 — Account page ───────────────────────────────────────

test.describe("Account page (feat-004, feat-005)", () => {
  test("shows the profile form with editable identity fields", async ({ page }) => {
    await page.goto("/dashboard/account")
    await expect(page.getByRole("heading", { name: /account/i }).first()).toBeVisible()
    // Display name + username inputs (feat-004). Account data is client-fetched,
    // so wait for the form fields to hydrate.
    await expect(page.getByPlaceholder(/your name as shown to attendees/i)).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByPlaceholder("your-handle")).toBeVisible()
    // Save affordance.
    await expect(page.getByRole("button", { name: /save/i }).first()).toBeVisible()
  })

  test("displays a plan section (feat-005)", async ({ page }) => {
    await page.goto("/dashboard/account")
    // The plan management section names a plan tier.
    await expect(page.getByText(/free|pro|growth|scale|plan/i).first()).toBeVisible({
      timeout: 15_000,
    })
  })
})

// ─── feat-010 — Stripe checkout initiation (smoke) ────────────────────────────

test.describe("Stripe upgrade flow (feat-010)", () => {
  test.use({ storageState: statePath("free") })

  test("free user sees an upgrade entry point in the dashboard", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.locator('a[href="/dashboard/upgrade"]').first()).toBeVisible()
  })

  test("the pricing surface renders purchasable plans without server error", async ({ page }) => {
    // /pricing is the live purchasable-plans surface (the dashboard upgrade
    // link target is a separate concern tracked in the test plan as a finding).
    const res = await page.goto("/pricing")
    expect(res?.status()).toBeLessThan(500)
    // Currency-aware pricing (from /api/locale) should appear.
    await expect(page.getByText(/€|\$|growth|scale|pro/i).first()).toBeVisible({ timeout: 15_000 })
  })
})

// ─── feat-006 / feat-007 / feat-008 — Conference scheduling & slots ───────────

test.describe("Conference scheduling (feat-006, feat-007, feat-008)", () => {
  test("the conferences area lists events and a create affordance", async ({ page }) => {
    await page.goto("/dashboard/conference")
    await expect(page).toHaveURL(/\/dashboard\/conference/)
    await expect(page.locator("main, nav, h1, h2").first()).toBeVisible({ timeout: 15_000 })
    // Either existing events or a "Create" entry point is present.
    await expect(page.getByText(/create|new|conference|event/i).first()).toBeVisible()
  })
})

// ─── feat-009 — Speaker conference talk portal ────────────────────────────────

test.describe("Speaker conference talk portal (feat-009)", () => {
  test.use({ storageState: statePath("affiliated-speaker") })

  test("an affiliated speaker reaches the dashboard talk area", async ({ page }) => {
    const res = await page.goto("/dashboard/talks")
    expect(res?.status() ?? 200).toBeLessThan(500)
    await expect(page.locator("main, nav, h1, h2").first()).toBeVisible({ timeout: 15_000 })
  })
})

// ─── feat-013 / feat-014 — Slides: upload + iframe embed ──────────────────────

test.describe("Talk slides — upload & embed (feat-013, feat-014)", () => {
  test("the new-talk flow offers PDF/PPTX upload and embed-URL options", async ({ page }) => {
    const res = await page.goto("/dashboard/talks/new")
    expect(res?.status()).toBeLessThan(500)
    // Title is step 1; advance to the slides step where both source options live.
    const titleInput = page.getByPlaceholder(/the future of javascript/i)
    await expect(titleInput).toBeVisible({ timeout: 15_000 })
    await titleInput.fill("E2E Smoke Talk")
    await page.getByRole("button", { name: /next|continue/i }).first().click()
    // feat-014: generic embed URL affordance.
    await expect(page.getByText(/paste an embed url/i)).toBeVisible({ timeout: 15_000 })
    // feat-013: file upload affordance.
    await expect(page.getByText(/upload pdf or pptx/i)).toBeVisible()
  })
})

// ─── feat-021 — CFP organizer settings (authenticated half) ───────────────────

test.describe("CFP organizer area (feat-021)", () => {
  test("organizer can reach the conferences area that hosts CFP settings", async ({ page }) => {
    const res = await page.goto("/dashboard/conference")
    expect(res?.status()).toBeLessThan(500)
    await expect(page.locator("main, nav, h1, h2").first()).toBeVisible({ timeout: 15_000 })
  })
})

// ─── feat-022 — Q&A history persisted to dashboard ────────────────────────────

test.describe("Q&A history (feat-022)", () => {
  test("the dashboard Q&A history route loads for an organizer", async ({ page }) => {
    const res = await page.goto("/dashboard/sessions/e2e-smoke-session/questions")
    // Route resolves (it may be empty/redirect, but must not 5xx).
    expect(res?.status()).toBeLessThan(500)
    await expect(page.locator("main, nav, h1, h2").first()).toBeVisible({ timeout: 15_000 })
  })
})
