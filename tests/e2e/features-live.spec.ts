import { test, expect } from "@playwright/test"

/**
 * E2E coverage for live-stage features backed by PartyKit realtime.
 *
 * Scope decision (deliberate): the realtime moderation features —
 *   feat-016 Q&A flagged questions stay visible (dimmed) to moderators
 *   feat-017 Q&A question deletion by moderator
 *   feat-018 ban user on question ban
 * — require two synchronized clients (a moderator and an attendee) against live
 * PartyKit infrastructure. A single-browser "does the route 200" check does not
 * exercise any of that behavior and gives false confidence, so those are tracked
 * as MANUAL in docs/evoca-test-plan.xlsx rather than asserted here.
 *
 * What IS meaningful to assert headless is the remote-token gate (feat-015):
 * an invalid/expired token must produce a graceful UI state, not a crash. That
 * is deterministic, server-rendered, and needs no realtime round-trip.
 *
 * Note: an anti-FOUC inline script keeps <body> hidden until the theme is
 * applied, so we assert on specific visible content rather than the body box.
 */

// ─── feat-015 — Phone remote token gate ───────────────────────────────────────

test.describe("Speaker phone remote (feat-015)", () => {
  test("an invalid remote token renders a graceful expired state, not a crash", async ({
    page,
  }) => {
    const res = await page.goto("/remote/invalid-token-xyz")
    expect(res?.status()).toBeLessThan(500)
    await expect(page.getByText(/remote link expired|invalid|expired/i).first()).toBeVisible({
      timeout: 15_000,
    })
  })
})
