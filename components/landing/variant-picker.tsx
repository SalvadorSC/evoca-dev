"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { GripHorizontal, X } from "lucide-react"

export type VariantId = "A" | "B" | "C" | "D"

const VARIANTS: { id: VariantId; label: string; description: string }[] = [
  { id: "A", label: "JSConf",  description: "Dark mono, yellow CTA" },
  { id: "B", label: "Clean",   description: "White card, emerald" },
  { id: "C", label: "Neon",    description: "Indigo, pill buttons" },
  { id: "D", label: "Brutal",  description: "Red, oversized type" },
]

interface Props {
  value: VariantId
  onChange: (v: VariantId) => void
}

export function FloatingVariantPicker({ value, onChange }: Props) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(true)
  // Position relative to viewport
  const [pos, setPos] = useState({ x: 24, y: 120 })
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    }
  }, [pos])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const panel = panelRef.current
      const pw = panel?.offsetWidth ?? 200
      const ph = panel?.offsetHeight ?? 140
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - pw, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - ph, e.clientY - dragOffset.current.y)),
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

  // Touch drag
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    dragOffset.current = { x: t.clientX - pos.x, y: t.clientY - pos.y }
  }, [pos])

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!panelRef.current) return
      const t = e.touches[0]
      const pw = panelRef.current.offsetWidth
      const ph = panelRef.current.offsetHeight
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - pw, t.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - ph, t.clientY - dragOffset.current.y)),
      })
    }
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    return () => window.removeEventListener("touchmove", onTouchMove)
  }, [])

  if (!mounted) return null

  const panel = (
    <div
      ref={panelRef}
      style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: 9999 }}
      className="select-none"
    >
      {visible ? (
        <div
          className="bg-jsconf-bg border border-jsconf-border shadow-2xl"
          style={{ minWidth: 220 }}
        >
          {/* Drag handle */}
          <div
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            className="flex items-center justify-between px-3 py-2 border-b border-jsconf-border cursor-grab active:cursor-grabbing bg-jsconf-surface"
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="h-3.5 w-3.5 text-jsconf-muted" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-jsconf-muted">
                UI Variant
              </span>
            </div>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setVisible(false)}
              className="text-jsconf-muted hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* Variant buttons */}
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
                  {v.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Collapsed pill */
        <button
          onClick={() => setVisible(true)}
          className="flex items-center gap-2 px-3 py-2 bg-jsconf-surface border border-jsconf-border font-mono text-[10px] uppercase tracking-widest text-jsconf-muted hover:text-foreground hover:border-white transition-colors shadow-lg"
        >
          <GripHorizontal className="h-3 w-3" />
          Variant: {value}
        </button>
      )}
    </div>
  )

  return createPortal(panel, document.body)
}
