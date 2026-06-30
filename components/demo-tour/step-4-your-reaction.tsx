"use client"

import { useState, useEffect } from "react"
import type { Reaction } from "@/lib/types"
import { StepShell, StepLabel, FakeSlide, YellowButton } from "./primitives"
import type { UserReaction } from "./primitives"
import { EmojiBurst } from "@/components/wall/emoji-burst"
import { ReactionCard } from "@/components/wall/reaction-card"

// The first three reactions are pre-seeded (already on the wall) so the room
// feels alive and continuous — they are NOT re-animated. A fresh reaction then
// arrives, the user's reaction lands as the 5th, and two more follow.
const PRESEED: { id: string; name: string; emoji: string; text: string }[] = [
  { id: "r1", name: "Priya", emoji: "🔥", text: "This is exactly what we needed!" },
  { id: "r2", name: "Marco", emoji: "👏", text: "" },
  { id: "r3", name: "Dana", emoji: "🤯", text: "Mind blown. Shipping this today." },
]

// Animated arrivals. `userId` is spliced in as the 5th reaction.
const BEFORE_USER: { id: string; name: string; emoji: string; text: string; at: number }[] = [
  { id: "r4", name: "Sam", emoji: "🚀", text: "", at: 700 },
]
const AFTER_USER: { id: string; name: string; emoji: string; text: string; at: number }[] = [
  { id: "r6", name: "Lena", emoji: "💚", text: "When can I use this at my meetup?", at: 2200 },
  { id: "r7", name: "Theo", emoji: "😂", text: "", at: 3000 },
]
const USER_AT = 1500
const LAST_AT = 3000

interface Step4YourReactionProps {
  userReaction: UserReaction
  onNext: () => void
}

export function Step4YourReaction({ userReaction, onNext }: Step4YourReactionProps) {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [ctaVisible, setCtaVisible] = useState(false)
  // Bumped on replay to restart the scripted feed.
  const [runId, setRunId] = useState(0)

  // The user's reaction lands last so it's the moment everything builds to.
  const userId = "user-reaction"

  useEffect(() => {
    // Pre-seed the first three reactions instantly with a PAST timestamp so
    // EmojiBurst skips animating them (it ignores reactions older than mount),
    // yet they stay listed in Live Comments for continuity.
    const seededTs = Date.now() - 10000
    setReactions(
      PRESEED.map((r) => ({
        type: "reaction",
        id: `${r.id}-${runId}`,
        name: r.name,
        text: r.text,
        emoji: r.emoji,
        ts: seededTs,
        flags: 0,
      })),
    )
    // ctaVisible intentionally not reset so the Replay + CTA stay on screen.

    // New arrival → user (5th) → two more, all freshly animated.
    const animated = [
      ...BEFORE_USER,
      {
        id: userId,
        name: userReaction.name || "Anonymous",
        emoji: userReaction.emoji,
        text: userReaction.text || "",
        at: USER_AT,
      },
      ...AFTER_USER,
    ]

    const timers: ReturnType<typeof setTimeout>[] = []

    animated.forEach((r) => {
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

    timers.push(setTimeout(() => setCtaVisible(true), LAST_AT + 700))

    return () => timers.forEach(clearTimeout)
  }, [runId, userReaction])

  // All text comments, newest first — same compact preview as step 2.
  const comments = reactions.filter((r) => r.text?.trim()).reverse()

  return (
    <StepShell label="Step 4: Your reaction on the wall">
      <div className="flex flex-col h-full p-5 pb-8 gap-4">
        <div className="flex items-center justify-between">
          <StepLabel>Your reaction just landed</StepLabel>
          <span className="flex items-center gap-1 font-mono text-[10px] text-jsconf-yellow uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-jsconf-yellow animate-pulse" />
            Live
          </span>
        </div>

        {/* Full-width talk stage with live reactions inside, same as step 2. */}
        <FakeSlide showProgress={false} showHeader={false}>
          <EmojiBurst key={runId} reactions={reactions} isQAMode={false} contained scale={0.62} />
        </FakeSlide>

        {/* Compact comment preview — the user's own comment gets a yellow ring. */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <StepLabel>Live comments</StepLabel>
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-0">
            {comments.length === 0 ? (
              <p className="font-mono text-xs text-jsconf-muted">
                Waiting for the first reaction…
              </p>
            ) : (
              comments.map((reaction, i) => {
                const isUser = reaction.id.startsWith(userId)
                return (
                  <div key={reaction.id} className="flex flex-col">
                    {isUser && (
                      <span className="self-start bg-jsconf-yellow text-black font-mono text-[9px] font-bold uppercase tracking-widest px-2 py-0.5">
                        Your reaction
                      </span>
                    )}
                    <div className={isUser ? "border-2 border-jsconf-yellow" : ""}>
                      <ReactionCard reaction={reaction} index={i} compact />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* CTA + replay — same controls as step 2. */}
        {ctaVisible && (
          <div className="flex items-stretch gap-3 animate-in fade-in duration-500">
            <button
              type="button"
              onClick={() => setRunId((n) => n + 1)}
              aria-label="Replay reactions"
              className="flex items-center justify-center px-4 text-2xl leading-none text-jsconf-muted border border-jsconf-border hover:text-foreground hover:border-foreground transition-colors shrink-0"
            >
              {"↺"}
            </button>
            <div className="flex-1">
              <YellowButton onClick={onNext}>Now Q&A →</YellowButton>
            </div>
          </div>
        )}
      </div>
    </StepShell>
  )
}
