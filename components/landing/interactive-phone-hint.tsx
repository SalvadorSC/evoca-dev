"use client"

import { useState, useEffect } from "react"
import { MousePointerClick } from "lucide-react"

// The DOM id of the hint badge, used as the react-xarrows start anchor.
export const PHONE_HINT_BADGE_ID = "evoca-hint-badge"

// A floating callout that points to the interactive phone mockup in the hero.
// Fixed to the top-left of the phone: it lives in the whitespace between the
// headline and the phone, so it never overlaps hero text (in either role) and
// never gets clipped by the right viewport edge. Rendered inside the phone's
// `relative` wrapper, so hovering it triggers the phone's own hover effect
// (frame lift + paused auto-reset). Clicking it pokes the phone (jiggle).
// The connecting arrow is drawn by react-xarrows from the parent, not here.
export function InteractivePhoneHint({ onPoke }: { onPoke?: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className={`absolute -top-2 -left-4 flex flex-col items-end transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
      style={{ transform: "translateX(-100%)" }}
    >
      <button
        id={PHONE_HINT_BADGE_ID}
        type="button"
        onClick={onPoke}
        aria-label="Poke the interactive demo"
        className="flex items-center gap-2 px-3 py-2 border select-none cursor-pointer transition-transform duration-150 hover:scale-[1.03] active:scale-95"
        style={{ borderColor: "var(--accent)", backgroundColor: "rgba(247,224,24,0.06)" }}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: "var(--accent)" }}
          />
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ backgroundColor: "var(--accent)" }}
          />
        </span>
        <MousePointerClick className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
        <span
          className="font-mono text-[11px] uppercase tracking-wider whitespace-nowrap"
          style={{ color: "var(--accent)" }}
        >
          Try it, it&apos;s interactive
        </span>
      </button>
    </div>
  )
}
