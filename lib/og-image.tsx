import { ImageResponse } from "next/og"

// Shared 1200x630 social card used by both /opengraph-image and /twitter-image
// so the OG and Twitter previews stay visually identical and in sync.
export const ogSize = { width: 1200, height: 630 }
export const ogContentType = "image/png"

export function renderSocialCard() {
  const accent = "#f7e018"
  const bg = "#080808"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: bg,
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand mark + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 84,
              height: 84,
              borderRadius: 20,
              background: accent,
              color: bg,
              fontSize: 52,
              fontWeight: 800,
            }}
          >
            E
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            EVOCA
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: 980,
            }}
          >
            Turn any talk into a live experience
          </div>
          <div style={{ fontSize: 32, color: "#a1a1aa", maxWidth: 900, lineHeight: 1.3 }}>
            Real-time reactions, live Q&A, and audience participation for speakers and organizers.
          </div>
        </div>

        {/* Footer accent bar + domain */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", height: 10, width: 220, borderRadius: 999, background: accent }} />
          <div style={{ fontSize: 30, color: "#ffffff", fontWeight: 600 }}>evoca.dev</div>
        </div>
      </div>
    ),
    { ...ogSize },
  )
}
