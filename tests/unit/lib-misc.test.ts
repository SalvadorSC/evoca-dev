import { describe, it, expect, beforeEach, vi } from "vitest"
import { cn } from "@/lib/utils"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { PARTY_HOST, DEFAULT_ROOM } from "@/lib/party"
import { SESSIONS } from "@/lib/sessions"

/**
 * Unit tests for small pure utility modules. Individually trivial, but they
 * pin down contracts (class merging, storage key stability, schedule integrity)
 * that the UI relies on, and keep the coverage gate honest.
 */

describe("cn (class name merge)", () => {
  it("joins truthy class values", () => {
    expect(cn("a", "b")).toBe("a b")
  })

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b")
  })

  it("merges conflicting tailwind utilities (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
    expect(cn("text-sm", "text-lg")).toBe("text-lg")
  })

  it("supports conditional object syntax", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active")
  })
})

describe("STORAGE_KEYS", () => {
  it("exposes stable, unique key strings", () => {
    const values = Object.values(STORAGE_KEYS)
    expect(values.length).toBeGreaterThan(0)
    // All keys must be unique so features don't clobber each other.
    expect(new Set(values).size).toBe(values.length)
  })

  it("keeps known keys stable (guards against accidental renames)", () => {
    expect(STORAGE_KEYS.votedQuestions).toBe("evoca-voted-questions")
    expect(STORAGE_KEYS.role).toBe("evoca-role")
    expect(STORAGE_KEYS.attendeeToken).toBe("evoca-attendee-token")
  })
})

describe("party config", () => {
  it("exposes a non-empty PartyKit host and default room", () => {
    expect(PARTY_HOST).toMatch(/partykit\.dev$/)
    expect(DEFAULT_ROOM.length).toBeGreaterThan(0)
  })
})

describe("SESSIONS schedule data", () => {
  it("has unique session ids", () => {
    const ids = SESSIONS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("uses valid HH:MM times and known track/type values", () => {
    const timeRe = /^\d{2}:\d{2}$/
    for (const s of SESSIONS) {
      expect(s.start).toMatch(timeRe)
      expect(s.end).toMatch(timeRe)
      expect(["main", "workshop"]).toContain(s.track)
      expect(["talk", "lightning", "workshop", "break"]).toContain(s.type)
    }
  })

  it("non-break sessions carry a speaker; breaks do not", () => {
    for (const s of SESSIONS) {
      if (s.type === "break") {
        expect(s.speaker).toBeNull()
      } else {
        expect(s.speaker).not.toBeNull()
      }
    }
  })
})
