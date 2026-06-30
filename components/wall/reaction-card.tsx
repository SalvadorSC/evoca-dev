"use client"

import { formatDistanceToNow } from "date-fns"
import type { Reaction } from "@/lib/types"

interface ReactionCardProps {
  reaction: Reaction
  index: number
  /** Smaller padding/typography — useful in constrained previews. */
  compact?: boolean
}

export function ReactionCard({ reaction, index, compact = false }: ReactionCardProps) {
  return (
    <div
      className={`bg-jsconf-surface-2 border border-jsconf-border animate-in slide-in-from-top duration-300 ${
        compact ? "p-2.5" : "p-4"
      }`}
      style={{
        animationDelay: `${index * 50}ms`,
        opacity: Math.max(0.4, 1 - index * 0.08),
      }}
    >
      <div className={`flex items-start ${compact ? "gap-2.5" : "gap-4"}`}>
        <span className={`leading-none ${compact ? "text-2xl" : "text-[2.5rem]"}`}>
          {reaction.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <p
            className={`text-white font-sans leading-relaxed ${compact ? "text-sm" : "text-lg"}`}
          >
            {reaction.text}
          </p>
          <div
            className={`flex items-center gap-2 font-mono text-jsconf-muted ${
              compact ? "mt-1 text-[11px]" : "mt-2 text-sm"
            }`}
          >
            <span className="font-medium">{reaction.name}</span>
            <span>·</span>
            <span>{formatDistanceToNow(reaction.ts, { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
