import { ImageResponse } from "next/og"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Shared 1200x630 social card. Recreates the marketing hero as a clean, static
// composition: EVOCA brand mark + headline on the left, the live "REACT" phone
// screenshot on the right. No nav, no buttons, no animated background.
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

// Hero wave background: same tiled 120x60 wave pattern as <WaveBackground>,
// stretched across the full 1200x630 card. resvg (used by Satori to rasterize
// img data URIs) supports <pattern>, so this renders the static hero look.
const waveSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_SIZE.width}" height="${OG_SIZE.height}" viewBox="0 0 ${OG_SIZE.width} ${OG_SIZE.height}"><defs><pattern id="w" x="0" y="0" width="120" height="60" patternUnits="userSpaceOnUse"><path d="M0 30 Q30 10 60 30 Q90 50 120 30" fill="none" stroke="${ACCENT}" stroke-width="2" stroke-opacity="0.10"/></pattern></defs><rect width="100%" height="100%" fill="url(#w)"/></svg>`
const waveDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(waveSvg)}`

// Read assets from disk (these routes run on the Node runtime).
const assetsDir = join(process.cwd(), "assets")
const fontsDir = join(assetsDir, "fonts")

const spaceGrotesk700 = readFileSync(join(fontsDir, "SpaceGrotesk-Bold.ttf"))
const inter400 = readFileSync(join(fontsDir, "Inter-Regular.ttf"))
const inter600 = readFileSync(join(fontsDir, "Inter-SemiBold.ttf"))

// Phone screenshot inlined as a base64 data URI so Satori can render it.
const phoneDataUri = `data:image/png;base64,${readFileSync(join(assetsDir, "og-phone.png")).toString("base64")}`

export function renderOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "stretch",
          position: "relative",
          backgroundColor: BG,
          fontFamily: "Inter",
        }}
      >
        {/* Hero wave background (full-bleed, behind all content) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={waveDataUri}
          width={OG_SIZE.width}
          height={OG_SIZE.height}
          alt=""
          style={{ position: "absolute", top: 0, left: 0 }}
        />

        {/* Left column: brand + headline + description + footer */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            padding: "72px 0 72px 80px",
          }}
        >
          {/* Brand row: logo icon + EVOCA wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoDataUri} width={60} height={60} alt="" />
            <span
              style={{
                fontFamily: "Space Grotesk",
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
              fontFamily: "Space Grotesk",
              fontSize: 60,
              fontWeight: 700,
              lineHeight: 1.1,
              color: FG,
              marginTop: 38,
              maxWidth: 640,
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
              fontSize: 28,
              lineHeight: 1.45,
              color: MUTED,
              marginTop: 26,
              maxWidth: 600,
            }}
          >
            Real-time reactions, live Q&amp;A, and audience participation for speakers and organizers.
          </div>

          {/* Footer: accent bar + domain */}
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 50 }}>
            <div style={{ display: "flex", width: 180, height: 8, backgroundColor: ACCENT, borderRadius: 4 }} />
            <span style={{ fontSize: 26, fontWeight: 600, color: FG }}>evoca.dev</span>
          </div>
        </div>

        {/* Right column: phone screenshot */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 460,
            position: "relative",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={phoneDataUri}
            height={620}
            alt="EVOCA live reaction screen on a phone"
            style={{
              transform: "rotate(6deg) translateY(40px)",
              filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.6))",
            }}
          />
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Space Grotesk", data: spaceGrotesk700, weight: 700, style: "normal" },
        { name: "Inter", data: inter400, weight: 400, style: "normal" },
        { name: "Inter", data: inter600, weight: 600, style: "normal" },
      ],
    },
  )
}
