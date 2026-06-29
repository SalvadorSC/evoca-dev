import { describe, it, expect, beforeAll, vi } from "vitest"

// The remote-token module reads SUPABASE_JWT_SECRET at call time, so set it
// before importing/exercising the functions.
beforeAll(() => {
  process.env.SUPABASE_JWT_SECRET = "test-secret-please-ignore-32chars-min"
})

async function load() {
  return await import("@/lib/remote-token")
}

describe("mintRemoteToken / verifyRemoteToken", () => {
  it("mints a token that verifies back to its scoped claims", async () => {
    const { mintRemoteToken, verifyRemoteToken } = await load()
    const token = await mintRemoteToken({
      userId: "user_123",
      sessionId: "sess_abc",
      room: "room_xyz",
    })
    expect(typeof token).toBe("string")

    const claims = await verifyRemoteToken(token)
    expect(claims).not.toBeNull()
    expect(claims).toMatchObject({
      sub: "user_123",
      role: "speaker",
      scope: "remote",
      sessionId: "sess_abc",
      room: "room_xyz",
    })
  })

  it("rejects a tampered token", async () => {
    const { mintRemoteToken, verifyRemoteToken } = await load()
    const token = await mintRemoteToken({ userId: "u", sessionId: "s", room: "r" })
    const tampered = token.slice(0, -3) + "abc"
    expect(await verifyRemoteToken(tampered)).toBeNull()
  })

  it("rejects a token signed with a different secret", async () => {
    const { mintRemoteToken } = await load()
    const token = await mintRemoteToken({ userId: "u", sessionId: "s", room: "r" })

    // Reset the module registry and re-import with a different secret so the
    // module re-reads the env — simulating a forged/foreign token.
    vi.resetModules()
    process.env.SUPABASE_JWT_SECRET = "a-completely-different-secret-value-here"
    const fresh = await import("@/lib/remote-token")
    expect(await fresh.verifyRemoteToken(token)).toBeNull()

    // Restore for any later tests.
    vi.resetModules()
    process.env.SUPABASE_JWT_SECRET = "test-secret-please-ignore-32chars-min"
  })

  it("rejects an obviously malformed token", async () => {
    const { verifyRemoteToken } = await load()
    expect(await verifyRemoteToken("not.a.jwt")).toBeNull()
    expect(await verifyRemoteToken("")).toBeNull()
  })
})
