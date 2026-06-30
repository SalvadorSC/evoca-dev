"use client"

import { useState, useEffect } from "react"
import type { Reaction } from "@/lib/types"
import { StepShell, StepLabel, FakeSlide, YellowButton } from "./primitives"
import { EmojiBurst } from "@/components/wall/emoji-burst"
import { ReactionCard } from "@/components/wall/reaction-card"

// A scripted feed that mirrors how reactions actually surface on the live wall.
// Emoji-only reactions float up over the talk; reactions with text pop in as
// comment cards — both rendered by the real <EmojiBurst> the product uses.
const SCRIPT: { id: string; name: string; emoji: string; text: string; at: number }[] = [
  { id: "r1", name: "Priya", emoji: "🔥", text: "This is exactly what we needed!", at: 600 },
  { id: "r2", name: "Marco", emoji: "👏", text: "", at: 1300 },
  { id: "r3", name: "Dana", emoji: "🤯", text: "Mind blown. Shipping this today.", at: 2100 },
  { id: "r4", name: "Sam", emoji: "🚀", text: "", at: 2700 },
  { id: "r5", name: "Lena", emoji: "💚", text: "When can I use this at my meetup?", at: 3500 },
  { id: "r6", name: "Theo", emoji: "😂", text: "", at: 4100 },
]

interface Step2WallProps {
  onNext: () => void
}

export function Step2Wall({ onNext }: Step2WallProps) {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [ctaVisible, setCtaVisible] = useState(false)
  // Bumped on replay to restart the scripted feed.
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    setReactions([])
    setCtaVisible(false)

    const timers: ReturnType<typeof setTimeout>[] = []

    SCRIPT.forEach((r) => {
      timers.push(
        setTimeout(() => {
          setReactions((prev) => [
            ...prev,
            {
              type: "reaction",
              // Unique per run so a replay isn't skipped by EmojiBurst's
              // already-processed id tracking.
              id: `${r.id}-${runId}`,
              name: r.name,
              text: r.text,
              emoji: r.emoji,
              ts: Date.now(),
              flags: 0,
            },
          ])
        }, r.at),
      )
    })

    const lastAt = SCRIPT[SCRIPT.length - 1].at
    timers.push(setTimeout(() => setCtaVisible(true), lastAt + 700))

    return () => timers.forEach(clearTimeout)
  }, [runId])

  // All text comments, newest first — kept compact below the stage so every
  // one stays visible and legible. Emoji-only reactions are not listed here.
  const comments = reactions
    .filter((r) => r.text?.trim())
    .reverse()

  return (
    <StepShell label="Step 2: Live wall">
      <div className="flex flex-col h-full p-5 pb-8 gap-4">
        <div className="flex items-center justify-between">
          <StepLabel>This is what the room sees</StepLabel>
          <span className="flex items-center gap-1 font-mono text-[10px] text-jsconf-yellow uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-jsconf-yellow animate-pulse" />
            Live
          </span>
        </div>

        {/* Full-width talk stage. The real wall component renders reactions
            (floating emojis + comment cards) inside the slide screen. */}
        <FakeSlide showProgress={false} showHeader={false}>
          <EmojiBurst key={runId} reactions={reactions} isQAMode={false} contained scale={0.62} />
        </FakeSlide>

        {/* Legible comment preview — reuses the real wall ReactionCard, compact. */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <StepLabel>Live comments</StepLabel>
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-0">
            {comments.length === 0 ? (
              <p className="font-mono text-xs text-jsconf-muted">
                Waiting for the first reaction…
              </p>
            ) : (
              comments.map((reaction, i) => (
                <ReactionCard key={reaction.id} reaction={reaction} index={i} compact />
              ))
            )}
          </div>
        </div>

        {/* CTA + replay */}
        {ctaVisible && (
          <div className="flex items-center gap-3 animate-in fade-in duration-500">
            <button
              type="button"
              onClick={() => setRunId((n) => n + 1)}
              aria-label="Replay reactions"
              className="flex items-center justify-center py-4 px-4 text-2xl leading-none text-jsconf-muted border border-jsconf-border hover:text-foreground hover:border-foreground transition-colors shrink-0"
            >
              {"↺"}
            </button>
            <div className="flex-1">
              <YellowButton onClick={onNext}>{"That's you next →"}</YellowButton>
            </div>
          </div>
        )}
      </div>
    </StepShell>
  )
}
