"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { MousePointerClick, Zap, Sparkles, ArrowRight, GripHorizontal, X } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

export type HintVariant = "A" | "B" | "C" | "D"

// ── Variant A — JSConf dark, yellow border, dashed arrow ─────────────────────
function HintA({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-0" onClick={onDismiss}>
      {/* Callout box */}
      <div
        className="flex items-center gap-2 px-3 py-2 border cursor-pointer select-none"
        style={{ borderColor: "var(--accent)", backgroundColor: "rgba(247,224,24,0.06)" }}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "var(--accent)" }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "var(--accent)" }} />
        </span>
        <MousePointerClick className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
        <span className="font-mono text-[11px] uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--accent)" }}>
          Try it, it&apos;s interactive
        </span>
      </div>
      {/* Arrow pointing right toward the phone */}
      <svg width="52" height="32" viewBox="0 0 52 32" fill="none" aria-hidden="true" className="shrink-0">
        <path
          d="M4 16 C 18 16, 28 8, 44 16"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M41 12 L46 16 L41 20"
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

// ── Variant B — Clean white card, subtle shadow, green accent ─────────────────
function HintB({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-0" onClick={onDismiss}>
      <div
        className="flex items-center gap-2 px-4 py-2.5 cursor-pointer select-none rounded-lg shadow-lg"
        style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
      >
        <Zap className="h-3.5 w-3.5 shrink-0" style={{ color: "#10b981" }} />
        <span className="text-[12px] font-medium whitespace-nowrap" style={{ color: "#1a202c" }}>
          Interactive — give it a tap
        </span>
        <span
          className="h-1.5 w-1.5 rounded-full animate-pulse shrink-0"
          style={{ backgroundColor: "#10b981" }}
        />
      </div>
      <svg width="48" height="32" viewBox="0 0 48 32" fill="none" aria-hidden="true" className="shrink-0">
        <path d="M6 16 Q 24 6 40 16" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M37 12 L42 16 L37 20" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  )
}

// ── Variant C — Neon, pill-shaped, glow ───────────────────────────────────────
function HintC({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-0" onClick={onDismiss}>
      <div
        className="flex items-center gap-2 px-4 py-2 cursor-pointer select-none"
        style={{
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          borderRadius: "9999px",
          boxShadow: "0 0 20px rgba(99,102,241,0.5)",
        }}
      >
        <Sparkles className="h-3.5 w-3.5 text-white shrink-0" />
        <span className="text-[11px] font-semibold text-white uppercase tracking-wider whitespace-nowrap">
          Live — try it now
        </span>
      </div>
      <svg width="48" height="32" viewBox="0 0 48 32" fill="none" aria-hidden="true" className="shrink-0">
        <path d="M6 16 Q 24 4 40 16" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M37 11 L42 16 L37 21" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  )
}

// ── Variant D — Brutalist, thick black border, red dot ────────────────────────
function HintD({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-0" onClick={onDismiss}>
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
        style={{ backgroundColor: "#ffffff", border: "2px solid #000", boxShadow: "3px 3px 0 #000" }}
      >
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0 animate-pulse"
          style={{ backgroundColor: "#ef4444" }}
        />
        <span className="text-[11px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: "#000" }}>
          Interactive
        </span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0" style={{ color: "#000" }} />
      </div>
      <svg width="44" height="32" viewBox="0 0 44 32" fill="none" aria-hidden="true" className="shrink-0">
        <path d="M4 16 L36 16" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        <path d="M33 11 L39 16 L33 21" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  )
}

// ── Map variant id to component ───────────────────────────────────────────────
const VARIANTS: { id: HintVariant; label: string; desc: string }[] = [
  { id: "A", label: "JSConf",   desc: "Dark, yellow, dashed arrow" },
  { id: "B", label: "Clean",    desc: "White card, green accent" },
  { id: "C", label: "Neon",     desc: "Purple pill with glow" },
  { id: "D", label: "Brutal",   desc: "Thick border, red dot" },
]

function HintBody({ variant, onDismiss }: { variant: HintVariant; onDismiss: () => void }) {
  if (variant === "B") return <HintB onDismiss={onDismiss} />
  if (variant === "C") return <HintC onDismiss={onDismiss} />
  if (variant === "D") return <HintD onDismiss={onDismiss} />
  return <HintA onDismiss={onDismiss} />
}

// ── Draggable floating picker (portal) ────────────────────────────────────────
function FloatingHintPicker({ value, onChange }: { value: HintVariant; onChange: (v: HintVariant) => void }) {
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
      const pw = panelRef.current?.offsetWidth ?? 220
      const ph = panelRef.current?.offsetHeight ?? 180
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - pw, e.clientX - offset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - ph, e.clientY - offset.current.y)),
      })
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    offset.current = { x: t.clientX - pos.x, y: t.clientY - pos.y }
  }, [pos])

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0]
      const pw = panelRef.current?.offsetWidth ?? 220
      const ph = panelRef.current?.offsetHeight ?? 180
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - pw, t.clientX - offset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - ph, t.clientY - offset.current.y)),
      })
    }
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    return () => window.removeEventListener("touchmove", onTouchMove)
  }, [])

  if (!mounted) return null

  const panel = (
    <div
      ref={panelRef}
      style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: 9998 }}
      className="select-none"
    >
      {open ? (
        <div className="bg-jsconf-bg border border-jsconf-border shadow-2xl" style={{ minWidth: 220 }}>
          <div
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            className="flex items-center justify-between px-3 py-2 border-b border-jsconf-border cursor-grab active:cursor-grabbing bg-jsconf-surface"
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="h-3.5 w-3.5 text-jsconf-muted" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-jsconf-muted">Hint Style</span>
            </div>
            <button onMouseDown={(e) => e.stopPropagation()} onClick={() => setOpen(false)} className="text-jsconf-muted hover:text-foreground transition-colors">
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="p-3 flex flex-col gap-1.5">
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                onClick={() => onChange(v.id)}
                className={`flex items-center justify-between px-3 py-2 font-mono text-xs uppercase tracking-wide border transition-all duration-150 text-left ${
                  value === v.id
                    ? "bg-jsconf-yellow text-black border-jsconf-yellow"
                    : "bg-transparent text-jsconf-muted border-jsconf-border hover:border-white hover:text-foreground"
                }`}
              >
                <span>{v.label}</span>
                <span className={`normal-case font-sans font-normal text-[10px] ${value === v.id ? "text-black/60" : "text-jsconf-muted"}`}>
                  {v.desc}
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
  const [variant, setVariant] = useState<HintVariant>("A")

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1000)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {/* The hint callout — rendered outside the phone's relative container
          so it sits to the left and points toward the phone */}
      {!dismissed && (
        <div
          className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3 pointer-events-none"}`}
        >
          <HintBody variant={variant} onDismiss={() => setDismissed(true)} />
        </div>
      )}

      {/* Draggable picker to switch between hint styles */}
      <FloatingHintPicker value={variant} onChange={setVariant} />
    </>
  )
}
