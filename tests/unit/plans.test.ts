import { describe, it, expect } from "vitest"
import {
  PLANS,
  ORGANIZER_PLAN_IDS,
  getPlan,
  isLivePlan,
  formatPrice,
} from "@/lib/plans"

describe("getPlan", () => {
  it("returns a known plan by id", () => {
    expect(getPlan("organizer_monthly")?.name).toBe("Growth")
  })
  it("returns undefined for an unknown id", () => {
    expect(getPlan("does_not_exist")).toBeUndefined()
  })
})

describe("isLivePlan", () => {
  it("is true for live organizer plans", () => {
    expect(isLivePlan("organizer_onetime")).toBe(true)
    expect(isLivePlan("organizer_monthly")).toBe(true)
    expect(isLivePlan("organizer_annual")).toBe(true)
  })
  it("is false for stubbed Speaker Pro plans", () => {
    expect(isLivePlan("speaker_pro_monthly")).toBe(false)
    expect(isLivePlan("speaker_pro_annual")).toBe(false)
  })
  it("is false for unknown ids", () => {
    expect(isLivePlan("nope")).toBe(false)
  })
})

describe("plan catalog integrity", () => {
  it("every plan's id matches its key", () => {
    for (const [key, plan] of Object.entries(PLANS)) {
      expect(plan.id).toBe(key)
    }
  })

  it("only organizer plans are surfaced in ORGANIZER_PLAN_IDS and all are live", () => {
    for (const id of ORGANIZER_PLAN_IDS) {
      const plan = getPlan(id)!
      expect(plan.audience).toBe("organizer")
      expect(plan.live).toBe(true)
    }
  })

  it("every plan has positive EUR and USD amounts", () => {
    for (const plan of Object.values(PLANS)) {
      expect(plan.amount.EUR).toBeGreaterThan(0)
      expect(plan.amount.USD).toBeGreaterThan(0)
    }
  })

  it("one-time plan grants a finite access window", () => {
    expect(PLANS.organizer_onetime.accessDays).toBe(7)
  })
})

describe("formatPrice", () => {
  it("formats whole euro amounts without decimals", () => {
    expect(formatPrice(4900, "EUR")).toBe("€49")
  })
  it("formats whole dollar amounts without decimals", () => {
    expect(formatPrice(5400, "USD")).toBe("$54")
  })
  it("keeps two decimals for non-round amounts", () => {
    expect(formatPrice(2999, "EUR")).toBe("€29.99")
  })
  it("formats zero", () => {
    expect(formatPrice(0, "USD")).toBe("$0")
  })
})
