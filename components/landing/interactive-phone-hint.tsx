"use client"

import { useState, useEffect } from "react"
import { MousePointerClick } from "lucide-react"

/**
 * A floating callout that points to the interactive phone mockup in the hero.
 * It pulses once on mount then dims to a subtle idle state.
 * Dismissible with a click.
 */
export function InteractivePhoneHint() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Delay slightly so it doesn't fight the page load animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1200)
    return () => clearTimeout(t)
  }, [])

  if (dismissed) return null

  return (
    <div
      aria-label="The phone is interactive — try tapping it"
      onClick={() => setDismissed(true)}
      className={`
        absolute bottom-8 right-0 z-20
        flex items-start gap-2.5
        cursor-pointer select-none
        transition-all duration-700 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"}
      `}
    >
      {/* Arrow line pointing left toward the phone */}
      <div className="flex flex-col items-end gap-1 mt-1">
        <div
          className="relative flex items-center gap-2 px-3 py-2 border"
          style={{
            borderColor: "var(--accent)",
            backgroundColor: "var(--accent-dim, rgba(247,224,24,0.08))",
          }}
        >
          {/* Animated ping dot */}
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
        </div>

        {/* Curved arrow pointing toward phone */}
        <svg
          width="48"
          height="28"
          viewBox="0 0 48 28"
          fill="none"
          className="mr-4"
          aria-hidden="true"
        >
          <path
            d="M44 2 C 30 2, 4 10, 4 24"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M1 20 L4 26 L8 21"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    </div>
  )
}
