/**
 * lib/dailymotion.ts — Dailymotion embed helpers
 *
 * Phase 1 (layout / embed-ready): organizers paste a Dailymotion video URL or
 * id and we render the standard embed player. A future phase can swap this for
 * the Dailymotion Partner API (create/start/stop live streams) — the parsed
 * `videoId` is already isolated here so the rest of the app stays unchanged.
 */

const DM_EMBED_BASE = "https://www.dailymotion.com/embed/video/"

/**
 * Extract a Dailymotion video id from common paste formats:
 *   - https://www.dailymotion.com/video/x8abc12
 *   - https://www.dailymotion.com/embed/video/x8abc12
 *   - https://dai.ly/x8abc12
 *   - x8abc12 (bare id)
 * Returns null if no plausible id is found.
 */
export function parseDailymotionId(input: string): string | null {
  const value = input.trim()
  if (!value) return null

  // Bare id: starts with x, alphanumeric.
  if (/^x[a-z0-9]+$/i.test(value)) return value

  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, "")
    if (host === "dai.ly") {
      const id = url.pathname.split("/").filter(Boolean)[0]
      return id || null
    }
    if (host.endsWith("dailymotion.com")) {
      // /video/<id>, /embed/video/<id>
      const parts = url.pathname.split("/").filter(Boolean)
      const id = parts[parts.length - 1]
      // Strip any extra slug after the id (e.g. x8abc12_title)
      return id ? id.split("_")[0] : null
    }
  } catch {
    // Not a URL — fall through.
  }
  return null
}

/** Build the canonical embed URL for a Dailymotion video id. */
export function dailymotionEmbedUrl(videoId: string): string {
  return `${DM_EMBED_BASE}${videoId}`
}

/**
 * Normalize a pasted value into { videoId, embedUrl }, or null if invalid.
 */
export function normalizeDailymotion(
  input: string,
): { videoId: string; embedUrl: string } | null {
  const videoId = parseDailymotionId(input)
  if (!videoId) return null
  return { videoId, embedUrl: dailymotionEmbedUrl(videoId) }
}
