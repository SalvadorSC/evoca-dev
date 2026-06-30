import { ImageResponse } from "next/og"

// Shared 1200x630 social card. Recreates the marketing hero as a clean, static
// composition: EVOCA brand mark (chat-bubble icon + wordmark) sitting on top of
// the headline + description. No nav, no buttons, no animated background.
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = "image/png"

// Brand colors (mirrors the dark theme tokens).
const BG = "#080808"
const FG = "#fafafa"
const MUTED = "#a1a1aa"
const ACCENT = "#f7e018"

// EVOCA chat-bubble mark as an inline SVG data URI (white stroke + dots).
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 28 28" fill="none"><path d="M4 6C4 4.89543 4.89543 4 6 4H22C23.1046 4 24 4.89543 24 6V18C24 19.1046 23.1046 20 22 20H10L6 24V20H6C4.89543 20 4 19.1046 4 18V6Z" stroke="${FG}" stroke-width="2" fill="none"/><circle cx="9" cy="12" r="1.5" fill="${FG}"/><circle cx="14" cy="12" r="1.5" fill="${FG}"/><circle cx="19" cy="12" r="1.5" fill="${FG}"/></svg>`
const logoDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(logoSvg)}`

export function renderOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: BG,
          padding: "80px 88px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand row: logo icon + EVOCA wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoDataUri} width={60} height={60} alt="" />
          <span
            style={{
              fontSize: 48,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: FG,
            }}
          >
            EVOCA
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 66,
            fontWeight: 800,
            lineHeight: 1.1,
            color: FG,
            marginTop: 40,
            maxWidth: 1010,
            letterSpacing: "-0.02em",
          }}
        >
          One platform for your schedule, speakers and live engagement
        </div>

        {/* Description */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 30,
            lineHeight: 1.45,
            color: MUTED,
            marginTop: 28,
            maxWidth: 860,
          }}
        >
          Manage your event, onboard speakers and give every session live engagement.
        </div>

        {/* Footer: accent bar + domain */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 56,
          }}
        >
          <div style={{ display: "flex", width: 200, height: 8, backgroundColor: ACCENT, borderRadius: 4 }} />
          <span style={{ fontSize: 26, color: MUTED }}>evoca.dev</span>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  )
}
