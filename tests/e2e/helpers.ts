import { type Page, expect } from "@playwright/test"

/**
 * Sign in as a seeded dev test account via the dev-login bypass.
 * Keys mirror app/api/dev-login/route.ts (see docs/test-accounts.md).
 * Requires the dev server (NODE_ENV=development) and seeded accounts.
 */
export async function devLogin(page: Page, account: string): Promise<void> {
  // Hitting this endpoint generates a magic-link, verifies it server-side to
  // set auth cookies, then redirects to /dashboard. The generateLink roundtrip
  // can be slow, so allow generous time and wait for the network to settle.
  await page.goto(`/api/dev-login?as=${account}`, { waitUntil: "commit" })
  await page.waitForURL("**/dashboard**", { timeout: 30_000 })
  await page.waitForLoadState("domcontentloaded")
}

/** The stable seeded public conference (created for QA). */
export const PUBLIC_CONFERENCE_SLUG = "test-conference-2026"
