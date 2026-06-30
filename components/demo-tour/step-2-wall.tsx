"use client"

import { useState, useEffect } from "react"
import { StepShell, StepLabel, FakeSlide, YellowButton } from "./primitives"

const FAKE_REACTIONS = [
  { id: "r1", emoji: "🔥", name: "Tanya K.", text: "This is exactly what we needed!", ts: Date.now() - 4000 },
  { id: "r2", emoji: "🤯", name: "Mikael L.", text: "Mind blown. Shipping this today.", ts: Date.now() - 2500 },
  { id: "r3", emoji: "👏", name: "Sam F.", text: "", ts: Date.now() - 1000 },
  { id: "r4", emoji: "🚀", name: "Priya M.", text: "When can I use this at my meetup?", ts: Date.now() - 400 },
]

interface Step2WallProps {
  onNext: () => void
}

export function Step2Wall({ onNext }: Step2WallProps) {
  const [shownCount, setShownCount] = useState(0)
  const [ctaVisible, setCtaVisible] = useState(false)

  useEffect(() => {
    // Stagger reactions in one-by-one
    const timers: ReturnType<typeof setTimeout>[] = []
    FAKE_REACTIONS.forEach((_, i) => {
      timers.push(
        setTimeout(() => setShownCount((c) => Math.max(c, i + 1)), 400 + i * 450),
      )
    })
    // Show CTA after all reactions are visible
    timers.push(setTimeout(() => setCtaVisible(true), 400 + FAKE_REACTIONS.length * 450 + 400))
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <StepShell label="Step 2: Live wall" scrollable>
      <div className="flex flex-col gap-4 p-5 pb-8 min-h-full">
        <StepLabel>The speaker&apos;s wall</StepLabel>

        {/* Slide mockup */}
        <FakeSlide progress={48} />

        {/* Reactions feed */}
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-jsconf-muted">
              Reactions from the audience
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px] text-jsconf-yellow">
              <span className="w-1.5 h-1.5 rounded-full bg-jsconf-yellow animate-pulse" />
              Live
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {FAKE_REACTIONS.slice(0, shownCount).map((r, index) => (
              <div
                key={r.id}
                className="bg-jsconf-surface border border-jsconf-border p-3 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300"
              >
                <span className="text-2xl leading-none shrink-0">{r.emoji}</span>
                <div className="min-w-0 flex-1">
                  {r.text && (
                    <p className="text-sm text-white font-sans leading-snug">{r.text}</p>
                  )}
                  <p className="font-mono text-xs text-jsconf-muted mt-0.5">{r.name}</p>
                </div>
              </div>
            ))}

            {/* Placeholder slots while loading */}
            {shownCount < FAKE_REACTIONS.length && (
              <div className="flex items-center gap-2 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-jsconf-yellow animate-pulse" />
                <span className="font-mono text-xs text-jsconf-muted">Reaction incoming...</span>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        {ctaVisible && (
          <div className="animate-in fade-in duration-500">
            <YellowButton onClick={onNext}>
              {"That's you next →"}
            </YellowButton>
          </div>
        )}
      </div>
    </StepShell>
  )
}
