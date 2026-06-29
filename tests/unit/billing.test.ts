import { describe, it, expect } from "vitest"
import {
  computeOrganizerAccess,
  hasOrganizerPrep,
  hasOrganizerLive,
  hasEventScopedPro,
  conferenceTalkStatus,
  isConferenceTalkReadOnly,
  validateEventWindow,
  slotAcceptsSpeaker,
  ONE_TIME_MAX_DAYS,
  type OrganizerSubscription,
  type OrganizerSubStatus,
} from "@/lib/billing"
import type { PlanId } from "@/lib/plans"

// Fixed "now" so all window math is deterministic.
const NOW = new Date("2026-06-15T12:00:00.000Z")

function sub(overrides: Partial<OrganizerSubscription> = {}): OrganizerSubscription {
  return {
    id: "sub_1",
    user_id: "user_1",
    stripe_customer_id: null,
    stripe_subscription_id: null,
    stripe_payment_intent_id: null,
    plan: "organizer_monthly",
    status: "active",
    event_start: null,
    event_end: null,
    activated_at: null,
    expires_at: null,
    created_at: NOW.toISOString(),
    updated_at: NOW.toISOString(),
    ...overrides,
  }
}

describe("computeOrganizerAccess — subscription plans", () => {
  it("grants live access for an active monthly subscription", () => {
    const access = computeOrganizerAccess([sub({ plan: "organizer_monthly", status: "active" })], NOW)
    expect(access.level).toBe("live")
    expect(access.plan).toBe("organizer_monthly")
    expect(access.subscriptionId).toBe("sub_1")
  })

  it("grants live access for an active annual subscription", () => {
    const access = computeOrganizerAccess([sub({ plan: "organizer_annual", status: "active" })], NOW)
    expect(access.level).toBe("live")
  })

  it("keeps prep access during payment_failed grace period", () => {
    const access = computeOrganizerAccess([sub({ status: "payment_failed" })], NOW)
    expect(access.level).toBe("prep")
  })

  it.each<OrganizerSubStatus>(["cancelled", "expired", "pending_activation"])(
    "grants no access when subscription status is %s",
    (status) => {
      const access = computeOrganizerAccess([sub({ status })], NOW)
      expect(access.level).toBe("none")
    },
  )
})

describe("computeOrganizerAccess — one-time plan window", () => {
  const base = { plan: "organizer_onetime" as PlanId, status: "active" as OrganizerSubStatus }

  it("is prep before the window opens", () => {
    const access = computeOrganizerAccess(
      [sub({ ...base, event_start: "2026-06-20T09:00:00Z", event_end: "2026-06-22T18:00:00Z" })],
      NOW,
    )
    expect(access.level).toBe("prep")
  })

  it("is live inside the window", () => {
    const access = computeOrganizerAccess(
      [sub({ ...base, event_start: "2026-06-14T09:00:00Z", event_end: "2026-06-16T18:00:00Z" })],
      NOW,
    )
    expect(access.level).toBe("live")
  })

  it("is none after the window closes", () => {
    const access = computeOrganizerAccess(
      [sub({ ...base, event_start: "2026-06-01T09:00:00Z", event_end: "2026-06-03T18:00:00Z" })],
      NOW,
    )
    expect(access.level).toBe("none")
  })

  it("is prep when no window is set yet", () => {
    const access = computeOrganizerAccess([sub({ ...base, event_start: null, event_end: null })], NOW)
    expect(access.level).toBe("prep")
  })

  it("is none when cancelled regardless of window", () => {
    const access = computeOrganizerAccess(
      [sub({ ...base, status: "cancelled", event_start: "2026-06-14T09:00:00Z", event_end: "2026-06-16T18:00:00Z" })],
      NOW,
    )
    expect(access.level).toBe("none")
  })
})

describe("computeOrganizerAccess — multiple subscriptions", () => {
  it("picks the strongest access level across rows", () => {
    const access = computeOrganizerAccess(
      [
        sub({ id: "a", status: "cancelled" }),
        sub({ id: "b", plan: "organizer_onetime", status: "active", event_start: null, event_end: null }), // prep
        sub({ id: "c", plan: "organizer_monthly", status: "active" }), // live
      ],
      NOW,
    )
    expect(access.level).toBe("live")
    expect(access.subscriptionId).toBe("c")
  })

  it("returns none for an empty subscription list", () => {
    expect(computeOrganizerAccess([], NOW).level).toBe("none")
  })
})

describe("hasOrganizerPrep / hasOrganizerLive", () => {
  it("prep helper is true for prep and live", () => {
    expect(hasOrganizerPrep({ level: "prep" } as never)).toBe(true)
    expect(hasOrganizerPrep({ level: "live" } as never)).toBe(true)
    expect(hasOrganizerPrep({ level: "none" } as never)).toBe(false)
  })

  it("live helper is true only for live", () => {
    expect(hasOrganizerLive({ level: "live" } as never)).toBe(true)
    expect(hasOrganizerLive({ level: "prep" } as never)).toBe(false)
    expect(hasOrganizerLive({ level: "none" } as never)).toBe(false)
  })
})

describe("hasEventScopedPro", () => {
  it("is true when an accepted affiliation has a live organizer subscription", () => {
    const result = hasEventScopedPro(
      [{ status: "accepted", subscription: sub({ plan: "organizer_monthly", status: "active" }) }],
      NOW,
    )
    expect(result).toBe(true)
  })

  it("is false when the affiliation is not accepted", () => {
    const result = hasEventScopedPro(
      [{ status: "pending", subscription: sub({ status: "active" }) }],
      NOW,
    )
    expect(result).toBe(false)
  })

  it("is false when there is no subscription", () => {
    expect(hasEventScopedPro([{ status: "accepted", subscription: null }], NOW)).toBe(false)
  })

  it("is false when the organizer is only prep (window not open)", () => {
    const result = hasEventScopedPro(
      [
        {
          status: "accepted",
          subscription: sub({
            plan: "organizer_onetime",
            status: "active",
            event_start: "2026-06-20T09:00:00Z",
            event_end: "2026-06-22T18:00:00Z",
          }),
        },
      ],
      NOW,
    )
    expect(result).toBe(false)
  })
})

describe("conferenceTalkStatus", () => {
  it("is upcoming before the window", () => {
    expect(conferenceTalkStatus("2026-06-20T00:00:00Z", "2026-06-22T00:00:00Z", NOW)).toBe("upcoming")
  })
  it("is live within the window", () => {
    expect(conferenceTalkStatus("2026-06-14T00:00:00Z", "2026-06-16T00:00:00Z", NOW)).toBe("live")
  })
  it("is past after the window", () => {
    expect(conferenceTalkStatus("2026-06-01T00:00:00Z", "2026-06-03T00:00:00Z", NOW)).toBe("past")
  })
  it("defaults to upcoming with no window", () => {
    expect(conferenceTalkStatus(null, null, NOW)).toBe("upcoming")
  })
})

describe("isConferenceTalkReadOnly", () => {
  it("is read-only once the event has ended", () => {
    expect(isConferenceTalkReadOnly("2026-06-03T00:00:00Z", NOW)).toBe(true)
  })
  it("is editable before the event ends", () => {
    expect(isConferenceTalkReadOnly("2026-06-20T00:00:00Z", NOW)).toBe(false)
  })
  it("is editable when no end date is set", () => {
    expect(isConferenceTalkReadOnly(null, NOW)).toBe(false)
  })
})

describe("validateEventWindow", () => {
  it("accepts a valid window within the max span", () => {
    expect(validateEventWindow("2026-06-20T09:00:00Z", "2026-06-22T18:00:00Z")).toEqual({ ok: true })
  })

  it("rejects when end is before start", () => {
    const result = validateEventWindow("2026-06-22T09:00:00Z", "2026-06-20T18:00:00Z")
    expect(result.ok).toBe(false)
  })

  it("rejects when end equals start", () => {
    const result = validateEventWindow("2026-06-20T09:00:00Z", "2026-06-20T09:00:00Z")
    expect(result.ok).toBe(false)
  })

  it(`rejects a window longer than ${ONE_TIME_MAX_DAYS} days`, () => {
    const result = validateEventWindow("2026-06-01T00:00:00Z", "2026-06-30T00:00:00Z")
    expect(result.ok).toBe(false)
  })

  it("rejects invalid dates", () => {
    const result = validateEventWindow("not-a-date", "also-bad")
    expect(result.ok).toBe(false)
  })

  it("accepts a window exactly at the max span boundary", () => {
    const start = "2026-06-01T00:00:00.000Z"
    const end = new Date(Date.parse(start) + ONE_TIME_MAX_DAYS * 24 * 60 * 60 * 1000).toISOString()
    expect(validateEventWindow(start, end)).toEqual({ ok: true })
  })
})

describe("slotAcceptsSpeaker", () => {
  it("accepts speaker-bearing slot types", () => {
    expect(slotAcceptsSpeaker("talk")).toBe(true)
    expect(slotAcceptsSpeaker("keynote")).toBe(true)
    expect(slotAcceptsSpeaker("panel")).toBe(true)
  })
  it("rejects break slots", () => {
    expect(slotAcceptsSpeaker("break")).toBe(false)
  })
})
