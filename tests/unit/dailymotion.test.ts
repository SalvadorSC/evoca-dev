import { describe, it, expect } from "vitest"
import {
  parseDailymotionId,
  dailymotionEmbedUrl,
  normalizeDailymotion,
} from "@/lib/dailymotion"

describe("parseDailymotionId", () => {
  it("parses a standard watch URL", () => {
    expect(parseDailymotionId("https://www.dailymotion.com/video/x8abc12")).toBe("x8abc12")
  })

  it("parses an embed URL", () => {
    expect(parseDailymotionId("https://www.dailymotion.com/embed/video/x8abc12")).toBe("x8abc12")
  })

  it("parses a short dai.ly URL", () => {
    expect(parseDailymotionId("https://dai.ly/x8abc12")).toBe("x8abc12")
  })

  it("accepts a bare id", () => {
    expect(parseDailymotionId("x8abc12")).toBe("x8abc12")
  })

  it("strips a trailing slug after the id", () => {
    expect(parseDailymotionId("https://www.dailymotion.com/video/x8abc12_my-talk-title")).toBe("x8abc12")
  })

  it("handles URLs without the www prefix", () => {
    expect(parseDailymotionId("https://dailymotion.com/video/x9zzz99")).toBe("x9zzz99")
  })

  it("trims surrounding whitespace", () => {
    expect(parseDailymotionId("  x8abc12  ")).toBe("x8abc12")
  })

  it("returns null for an empty string", () => {
    expect(parseDailymotionId("")).toBeNull()
    expect(parseDailymotionId("   ")).toBeNull()
  })

  it("returns null for an unrelated URL", () => {
    expect(parseDailymotionId("https://youtube.com/watch?v=abc")).toBeNull()
  })

  it("returns null for arbitrary non-id text", () => {
    expect(parseDailymotionId("hello world")).toBeNull()
  })
})

describe("dailymotionEmbedUrl", () => {
  it("builds the canonical embed URL", () => {
    expect(dailymotionEmbedUrl("x8abc12")).toBe("https://www.dailymotion.com/embed/video/x8abc12")
  })
})

describe("normalizeDailymotion", () => {
  it("returns id + embed URL for valid input", () => {
    expect(normalizeDailymotion("https://dai.ly/x8abc12")).toEqual({
      videoId: "x8abc12",
      embedUrl: "https://www.dailymotion.com/embed/video/x8abc12",
    })
  })

  it("returns null for invalid input", () => {
    expect(normalizeDailymotion("not a video")).toBeNull()
  })

  it("round-trips an already-embed URL", () => {
    const normalized = normalizeDailymotion("https://www.dailymotion.com/embed/video/x8abc12")
    expect(normalized?.embedUrl).toBe("https://www.dailymotion.com/embed/video/x8abc12")
  })
})
