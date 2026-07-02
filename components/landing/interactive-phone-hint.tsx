"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { MousePointerClick, GripHorizontal, X } from "lucide-react"

// ── Position variants ─────────────────────────────────────────────────────────
// All variants share the same JSConf yellow / dashed style.
// What changes is WHERE the callout sits relative to the phone and the arrow shape.

export type HintPosition = "left" | "top-left" | "bottom-right" | "badge"

// The callout pill — always the same visual style
function Callout({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      onClick={onDismiss}
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
    </div>
  )
}

// ── Position: left ────────────────────────────────────────────────────────────
// Callout floats to the left of the phone, arrow curves right toward it.
// Uses absolute + translateX(-100%) so it doesn't affect phone layout.
function PositionLeft({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="absolute top-1/2 right-full flex items-center" style={{ transform: "translateY(-50%)" }}>
      <Callout onDismiss={onDismiss} />
      <svg width="56" height="40" viewBox="0 0 56 40" fill="none" aria-hidden="true" className="shrink-0">
        <path
          d="M4 20 C 18 20, 30 10, 48 20"
          stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 3"
          strokeLinecap="round" fill="none"
        />
        <path d="M45 14 L51 20 L45 26" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  )
}

// ── Position: top-left ────────────────────────────────────────────────────────
// Callout above-left of the phone, arrow swoops down-right
// Rendered absolute, positioned top-left of the phone wrapper
function PositionTopLeft({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="absolute -top-2 -left-4 flex flex-col items-end" style={{ transform: "translateX(-100%)" }}>
      <Callout onDismiss={onDismiss} />
      <svg width="64" height="52" viewBox="0 0 64 52" fill="none" aria-hidden="true" className="mr-0 -mt-1 self-end">
        <path
          d="M52 4 C 52 28, 32 40, 12 48"
          stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 3"
          strokeLinecap="round" fill="none"
        />
        <path d="M7 44 L13 50 L16 43" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  )
}

// ── Position: bottom-right ────────────────────────────────────────────────────
// Callout sits below-right of the phone, arrow curves up-left toward the screen
function PositionBottomRight({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="absolute -bottom-2 -right-4" style={{ transform: "translateX(100%)" }}>
      <svg width="64" height="52" viewBox="0 0 64 52" fill="none" aria-hidden="true" className="mb-0">
        <path
          d="M12 48 C 12 24, 32 12, 52 4"
          stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 3"
          strokeLinecap="round" fill="none"
        />
        <path d="M57 8 L51 2 L48 9" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <Callout onDismiss={onDismiss} />
    </div>
  )
}

// ── Position: badge ───────────────────────────────────────────────────────────
// Compact sticky tab anchored to the bottom-right corner of the phone frame.
// Arrow points left into the phone screen.
function PositionBadge({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="absolute bottom-16 -right-2" style={{ transform: "translateX(100%)" }}>
      <div className="flex items-center gap-0">
        <svg width="36" height="28" viewBox="0 0 36 28" fill="none" aria-hidden="true" className="shrink-0">
          <path
            d="M32 14 C 20 14, 12 8, 4 14"
            stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 3"
            strokeLinecap="round" fill="none"
          />
          <path d="M7 9 L2 14 L7 19" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <div
          onClick={onDismiss}
          className="flex items-center gap-1.5 px-2.5 py-1.5 border cursor-pointer select-none"
          style={{ borderColor: "var(--accent)", backgroundColor: "rgba(247,224,24,0.06)" }}
        >
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "var(--accent)" }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: "var(--accent)" }} />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--accent)" }}>
            Interactive
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Draggable floating picker (portal) ────────────────────────────────────────
const POSITIONS: { id: HintPosition; label: string; desc: string }[] = [
  { id: "left",         label: "Left",         desc: "Beside the phone, arrow right" },
  { id: "top-left",     label: "Top left",     desc: "Above, arrow swoops down" },
  { id: "bottom-right", label: "Bottom right", desc: "Below, arrow curves up" },
  { id: "badge",        label: "Badge",        desc: "Compact tab on phone edge" },
]

export function FloatingHintPicker({ value, onChange }: { value: HintPosition; onChange: (v: HintPosition) => void }) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(true)
  const [pos, setPos] = useState({ x: 24, y: 120 })
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
  }, [pos])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const pw = panelRef.current?.offsetWidth ?? 240
      const ph = panelRef.current?.offsetHeight ?? 200
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - pw, e.clientX - offset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - ph, e.clientY - offset.current.y)),
      })
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
  }, [])

  if (!mounted) return null

  const panel = (
    <div ref={panelRef} style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: 9998 }} className="select-none">
      {open ? (
        <div className="bg-jsconf-bg border border-jsconf-border shadow-2xl" style={{ minWidth: 240 }}>
          <div
            onMouseDown={onMouseDown}
            className="flex items-center justify-between px-3 py-2 border-b border-jsconf-border cursor-grab active:cursor-grabbing bg-jsconf-surface"
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="h-3.5 w-3.5 text-jsconf-muted" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-jsconf-muted">Hint Position</span>
            </div>
            <button onMouseDown={(e) => e.stopPropagation()} onClick={() => setOpen(false)} className="text-jsconf-muted hover:text-foreground transition-colors">
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="p-3 flex flex-col gap-1.5">
            {POSITIONS.map((p) => (
              <button
                key={p.id}
                onClick={() => onChange(p.id)}
                className={`flex items-center justify-between px-3 py-2 font-mono text-xs uppercase tracking-wide border transition-all duration-150 text-left w-full ${
                  value === p.id
                    ? "bg-jsconf-yellow text-black border-jsconf-yellow"
                    : "bg-transparent text-jsconf-muted border-jsconf-border hover:border-white hover:text-foreground"
                }`}
              >
                <span>{p.label}</span>
                <span className={`normal-case font-sans font-normal text-[10px] ${value === p.id ? "text-black/60" : "text-jsconf-muted"}`}>
                  {p.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-jsconf-surface border border-jsconf-border font-mono text-[10px] uppercase tracking-widest text-jsconf-muted hover:text-foreground hover:border-white transition-colors shadow-lg"
        >
          <GripHorizontal className="h-3 w-3" />
          Hint: {value}
        </button>
      )}
    </div>
  )

  return createPortal(panel, document.body)
}

// ── Main export ───────────────────────────────────────────────────────────────
export function InteractivePhoneHint() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [position, setPosition] = useState<HintPosition>("left")

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1000)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {!dismissed && (
        <div
          className={`transition-opacity duration-700 ease-out ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          {position === "left"         && <PositionLeft         onDismiss={() => setDismissed(true)} />}
          {position === "top-left"     && <PositionTopLeft      onDismiss={() => setDismissed(true)} />}
          {position === "bottom-right" && <PositionBottomRight  onDismiss={() => setDismissed(true)} />}
          {position === "badge"        && <PositionBadge        onDismiss={() => setDismissed(true)} />}
        </div>
      )}

      <FloatingHintPicker value={position} onChange={(p) => { setDismissed(false); setPosition(p) }} />
    </>
  )
}
