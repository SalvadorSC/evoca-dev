"use client"

import { useState, useEffect, useRef } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────
export type WaveAnimation = "none" | "slow-drift" | "cursor" | "drift-cursor"

// ─── Wave Background ──────────────────────────────────────────────────────────
export function WaveBackground({
  accentColor = "#F7E018",
  waveAnimation = "drift-cursor",
}: {
  accentColor?: string
  waveAnimation?: WaveAnimation
}) {
  const [paused, setPaused] = useState(false)
  const [cursor, setCursor] = useState({ x: 0.5, y: 0.5 })
  const targetCursor = useRef({ x: 0.5, y: 0.5 })
  const currentCursor = useRef({ x: 0.5, y: 0.5 })
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden)
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [])

  useEffect(() => {
    if (waveAnimation !== "cursor" && waveAnimation !== "drift-cursor") {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    const onMove = (e: MouseEvent) => {
      targetCursor.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      }
    }
    window.addEventListener("mousemove", onMove)

    const LERP = 0.04
    const tick = () => {
      const cur = currentCursor.current
      const tgt = targetCursor.current
      const nx = cur.x + (tgt.x - cur.x) * LERP
      const ny = cur.y + (tgt.y - cur.y) * LERP
      currentCursor.current = { x: nx, y: ny }
      setCursor({ x: nx, y: ny })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("mousemove", onMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [waveAnimation])

  const shouldAnimate = !paused && waveAnimation !== "none"

  const driftAnim =
    shouldAnimate && (waveAnimation === "slow-drift" || waveAnimation === "drift-cursor")
      ? "wave-drift-left 18s linear infinite"
      : "none"

  const useCursor = waveAnimation === "cursor" || waveAnimation === "drift-cursor"
  const cursorTransform = useCursor
    ? `translateY(${(cursor.y - 0.5) * -30}px) translateX(${(cursor.x - 0.5) * -20}px)`
    : undefined

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <style>{`
          @keyframes wave-drift-left {
            from { transform: translateX(0); }
            to   { transform: translateX(-120px); }
          }
        `}</style>
        <pattern id="wave-pattern" x="0" y="0" width="120" height="60" patternUnits="userSpaceOnUse">
          <path
            d="M0 30 Q30 10 60 30 Q90 50 120 30"
            fill="none"
            stroke={accentColor}
            strokeWidth="2"
            strokeOpacity="0.10"
          />
        </pattern>
      </defs>

      {/* Outer g: cursor nudge. Inner g: drift. Separate to prevent animation overriding transform. */}
      <g style={{ transform: cursorTransform, willChange: "transform" }}>
        <g style={{ animation: driftAnim, willChange: "transform" }}>
          <rect x="-120" width="calc(100% + 240px)" height="100%" fill="url(#wave-pattern)" />
        </g>
      </g>
    </svg>
  )
}

// ─── Reduced Motion Toggle ─────────────────────────────────────────────────────
// A single switch that toggles between "drift-cursor" (on) and "none" (off).
// Shown only in the dev overlay context but exported for reuse.
export function ReducedMotionToggle({
  value,
  onChange,
}: {
  value: WaveAnimation
  onChange: (v: WaveAnimation) => void
}) {
  const isAnimating = value !== "none"

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9999,
        fontFamily: "monospace",
        fontSize: 11,
        background: "rgba(10,10,10,0.92)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(8px)",
        padding: "7px 10px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        userSelect: "none",
      }}
    >
      <span style={{ color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Wave FX
      </span>

      {/* Switch */}
      <div
        onClick={() => onChange(isAnimating ? "none" : "drift-cursor")}
        style={{
          position: "relative",
          width: 32,
          height: 18,
          borderRadius: 9,
          background: isAnimating ? "#F7E018" : "#333",
          cursor: "pointer",
          transition: "background 200ms",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: isAnimating ? 17 : 3,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: isAnimating ? "#000" : "#666",
            transition: "left 200ms, background 200ms",
          }}
        />
      </div>

      <span style={{ color: isAnimating ? "#fff" : "#555", minWidth: 18, transition: "color 200ms" }}>
        {isAnimating ? "on" : "off"}
      </span>
    </div>
  )
}
