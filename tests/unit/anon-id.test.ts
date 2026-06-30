import { describe, it, expect, afterEach, vi } from "vitest"
import { getAnonId } from "@/lib/anon-id"
import { STORAGE_KEYS } from "@/lib/storage-keys"

/**
 * getAnonId() returns a stable per-browser id. The test environment is node
 * (no window), so we stub `window`, `localStorage`, and `crypto` to exercise
 * each branch: SSR fallback, fresh creation + persistence, reuse, and the
 * localStorage-unavailable fallback.
 */

afterEach(() => {
  vi.unstubAllGlobals()
})

function makeLocalStorage(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial))
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    _store: store,
  }
}

describe("getAnonId", () => {
  it("returns an ephemeral SSR id when window is undefined", () => {
    // window is not defined in the node test env by default.
    expect(getAnonId()).toBe("ssr-anon")
  })

  it("creates and persists a new id on first use", () => {
    const ls = makeLocalStorage()
    vi.stubGlobal("window", {})
    vi.stubGlobal("localStorage", ls)
    vi.stubGlobal("crypto", { randomUUID: () => "fixed-uuid-1234" })

    const id = getAnonId()
    expect(id).toBe("anon_fixed-uuid-1234")
    // It should have been written back to storage under the attendee token key.
    expect(ls.getItem(STORAGE_KEYS.attendeeToken)).toBe("anon_fixed-uuid-1234")
  })

  it("reuses an existing persisted id", () => {
    const ls = makeLocalStorage({ [STORAGE_KEYS.attendeeToken]: "anon_existing" })
    vi.stubGlobal("window", {})
    vi.stubGlobal("localStorage", ls)
    vi.stubGlobal("crypto", { randomUUID: () => "should-not-be-used" })

    expect(getAnonId()).toBe("anon_existing")
  })

  it("falls back to an ephemeral id when localStorage throws", () => {
    vi.stubGlobal("window", {})
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked (private mode)")
      },
      setItem: () => {},
    })
    vi.stubGlobal("crypto", { randomUUID: () => "ephemeral-uuid" })

    expect(getAnonId()).toBe("anon_ephemeral-uuid")
  })
})
