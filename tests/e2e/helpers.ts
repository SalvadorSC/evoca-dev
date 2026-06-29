import path from "node:path"
import { type Page } from "@playwright/test"

/**
 * Sign in as a seeded dev test account via the dev-login bypass.
 * Keys mirror app/api/dev-login/route.ts (see docs/test-accounts.md).
 * Requires the dev server (NODE_ENV=development) and seeded accounts.
 *
 * NOTE: This is intended to be called once per account from auth.setup.ts.
 * Issuing a fresh magic-link invalidates any previous token for the same
 * email, so calling this concurrently across parallel workers races and
 * produces /auth/error. Tests should reuse the saved storage state instead.
 */
export async function devLogin(page: Page, account: Account): Promise<void> {
  await page.goto(`/api/dev-login?as=${account}`, { waitUntil: "commit" })
  await page.waitForURL("**/dashboard**", { timeout: 30_000 })
  await page.waitForLoadState("domcontentloaded")
}

/** Dev-login account keys used across the E2E suite. */
export type Account = "organizer-live" | "free" | "affiliated-speaker"

/** All accounts that auth.setup.ts authenticates and persists state for. */
export const ACCOUNTS: Account[] = ["organizer-live", "free", "affiliated-speaker"]

/** Directory where per-account Playwright storage states are persisted. */
export const AUTH_DIR = path.join(__dirname, ".auth")

/** Absolute path to the saved storage state for a given account. */
export function statePath(account: Account): string {
  return path.join(AUTH_DIR, `${account}.json`)
}

/** The stable seeded public conference (created for QA). */
export const PUBLIC_CONFERENCE_SLUG = "test-conference-2026"
