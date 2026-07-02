"use client"

import { useState } from "react"

export type VariantId = "A" | "B" | "C" | "D"

const VARIANTS: { id: VariantId; label: string; description: string }[] = [
  { id: "A", label: "JSConf", description: "Dark, mono, yellow" },
  { id: "B", label: "Clean", description: "White card, green" },
  { id: "C", label: "Neon", description: "Indigo, pill buttons" },
  { id: "D", label: "Brutal", description: "Red, oversized type" },
]

interface VariantPickerProps {
  value: VariantId
  onChange: (v: VariantId) => void
}

export function VariantPicker({ value, onChange }: VariantPickerProps) {
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-jsconf-muted">
        UI Variant
      </span>
      <div className="flex gap-1.5">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            onClick={() => onChange(v.id)}
            title={v.description}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wide border transition-all duration-150 ${
              value === v.id
                ? "bg-jsconf-yellow text-black border-jsconf-yellow"
                : "bg-transparent text-jsconf-muted border-jsconf-border hover:border-white hover:text-foreground"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  )
}
