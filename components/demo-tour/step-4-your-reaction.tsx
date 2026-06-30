"use client"

import { useState, useEffect } from "react"
import { StepShell, StepLabel, FakeSlide, YellowButton } from "./primitives"
import type { UserReaction } from "./primitives"

const SEEDED_REACTIONS = [
  { id: "s1", emoji: "🔥", name: "Tanya K.", text: "This is exactly what we needed!" },
  { id: "s2", emoji: "🤯", name: "Mikael L.", text: "Mind blown. Shipping this today." },
  { id: "s3", emoji: "👏", name: "Sam F.", text: "" },
]

interface Step4YourReactionProps {
  userReaction: UserReaction
  onNext: () => void
}

export function Step4YourReaction({ userReaction, onNext }: Step4YourReactionProps) {
  const [ctaVisible, setCtaVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setCtaVisible(true), 1800)
    return () => clearTimeout(t)
  }, [])

  return (
    <StepShell label="Step 4: Your reaction on the wall" scrollable>
      <div className="flex flex-col gap-4 p-5 pb-8 min-h-full">
        <StepLabel>The speaker&apos;s wall</StepLabel>

        <FakeSlide progress={62} />

        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-jsconf-muted">
              Reactions
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px] text-jsconf-yellow">
              <span className="w-1.5 h-1.5 rounded-full bg-jsconf-yellow animate-pulse" />
              Live
            </span>
          </div>

          {/* User's own reaction — highlighted, first */}
          <div className="bg-jsconf-surface border-2 border-jsconf-yellow p-3 flex items-start gap-3 animate-in slide-in-from-top-4 duration-500 relative">
            <span
              className="absolute -top-3 left-3 bg-jsconf-yellow text-black font-mono text-[9px] font-bold uppercase tracking-widest px-2 py-0.5"
            >
              Your reaction
            </span>
            <span className="text-2xl leading-none shrink-0 mt-1">{userReaction.emoji}</span>
            <div className="min-w-0 flex-1">
              {userReaction.text && (
                <p className="text-sm text-white font-sans leading-snug">{userReaction.text}</p>
              )}
              <p className="font-mono text-xs text-jsconf-muted mt-0.5">
                {userReaction.name || "Anonymous"}
              </p>
            </div>
          </div>

          {/* Seeded reactions below */}
          {SEEDED_REACTIONS.map((r, i) => (
            <div
              key={r.id}
              className="bg-jsconf-surface border border-jsconf-border p-3 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300"
              style={{ animationDelay: `${300 + i * 200}ms` }}
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
        </div>

        {ctaVisible && (
          <div className="animate-in fade-in duration-500">
            <YellowButton onClick={onNext}>Now Q&A →</YellowButton>
          </div>
        )}
      </div>
    </StepShell>
  )
}
