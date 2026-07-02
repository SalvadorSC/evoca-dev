"use client"

import { useState, useEffect } from "react"
import { MousePointerClick } from "lucide-react"

// A floating callout that points to the interactive phone mockup in the hero.
// Fixed to the top-left of the phone: it lives in the whitespace between the
// headline and the phone, so it never overlaps hero text (in either role) and
// never gets clipped by the right viewport edge. Rendered as an absolute child
// of the phone's `relative` wrapper. Click to dismiss.
export function InteractivePhoneHint() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1000)
    return () => clearTimeout(t)
  }, [])

  if (dismissed) return null

  return (
    <div
      className={`absolute -top-2 -left-4 flex flex-col items-end transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
      style={{ transform: "translateX(-100%)" }}
    >
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss hint"
        className="flex items-center gap-2 px-3 py-2 border cursor-pointer select-none"
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

      {/* Dashed arrow swooping down-right toward the phone's top-left corner */}
      <svg width="64" height="52" viewBox="0 0 64 52" fill="none" aria-hidden="true" className="-mt-1 self-end">
        <path
          d="M52 4 C 52 28, 32 40, 12 48"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M7 44 L13 50 L16 43"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  )
}
