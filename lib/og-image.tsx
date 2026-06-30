import { ImageResponse } from "next/og"

// Shared 1200x630 social card used by both /opengraph-image and /twitter-image
// so the OG and Twitter previews stay visually identical and in sync.
export const ogSize = { width: 1200, height: 630 }
export const ogContentType = "image/png"

const accent = "#f7e018"
const bg = "#080808"
const surface = "#141414"
const border = "#2a2a2a"
const muted = "#a1a1aa"

// A simplified, illustrative version of the attendee REACT tab. Drawn with
// styled divs because next/og (Satori) can't render the real component.
function PhoneMockup() {
  const emojis = ["🔥", "🤯", "😂", "💀", "👏", "🚀"]
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 300,
        height: 540,
        borderRadius: 40,
        border: `2px solid ${border}`,
        background: "#0d0d0d",
        padding: 16,
        // slight tilt for a dynamic, on-brand product feel
        transform: "rotate(4deg)",
      }}
    >
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            height: 40,
            background: accent,
            color: bg,
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "0.05em",
          }}
        >
          REACT
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            height: 40,
            background: surface,
            color: muted,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
        >
          ASK
        </div>
      </div>

      {/* Name field */}
      <div style={{ display: "flex", fontSize: 12, color: muted, letterSpacing: "0.08em", marginBottom: 6 }}>
        YOUR NAME
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 38,
          background: surface,
          border: `1px solid ${border}`,
          color: "#ffffff",
          fontSize: 14,
          paddingLeft: 12,
          marginBottom: 16,
        }}
      >
        Anonymous
      </div>

      {/* Feeling label */}
      <div style={{ display: "flex", fontSize: 12, color: muted, letterSpacing: "0.08em", marginBottom: 10 }}>
        HOW ARE YOU FEELING?
      </div>

      {/* Emoji grid */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        {emojis.map((e) => (
          <div
            key={e}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 76,
              height: 60,
              background: surface,
              border: `1px solid ${border}`,
              fontSize: 30,
            }}
          >
            {e}
          </div>
        ))}
      </div>

      {/* Send button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 48,
          background: accent,
          color: bg,
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: "0.05em",
          marginTop: "auto",
        }}
      >
        SEND REACTION
      </div>
    </div>
  )
}

export function renderSocialCard() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: bg,
          fontFamily: "sans-serif",
        }}
      >
        {/* Left: brand + headline + footer */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            flex: 1,
            padding: "72px",
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
                display: "flex",
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
                display: "flex",
                fontSize: 68,
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                maxWidth: 620,
              }}
            >
              Turn any talk into a live experience
            </div>
            <div style={{ display: "flex", fontSize: 30, color: muted, maxWidth: 600, lineHeight: 1.3 }}>
              Real-time reactions, live Q&A, and audience participation for speakers and organizers.
            </div>
          </div>

          {/* Footer accent bar + domain */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", height: 10, width: 220, borderRadius: 999, background: accent }} />
            <div style={{ display: "flex", fontSize: 30, color: "#ffffff", fontWeight: 600 }}>evoca.dev</div>
          </div>
        </div>

        {/* Right: phone mockup */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 460,
            height: "100%",
          }}
        >
          <PhoneMockup />
        </div>
      </div>
    ),
    { ...ogSize },
  )
}
