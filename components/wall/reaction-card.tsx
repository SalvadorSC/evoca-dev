"use client"

import { formatDistanceToNow } from "date-fns"
import type { Reaction } from "@/lib/types"

interface ReactionCardProps {
  reaction: Reaction
  index: number
}

export function ReactionCard({ reaction, index }: ReactionCardProps) {
  return (
    <div
      className="bg-jsconf-surface-2 border border-jsconf-border p-4 animate-in slide-in-from-top duration-300"
      style={{
        animationDelay: `${index * 50}ms`,
        opacity: Math.max(0.4, 1 - index * 0.08),
      }}
    >
      <div className="flex items-start gap-4">
        <span className="text-[2.5rem] leading-none">{reaction.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-lg text-white font-sans leading-relaxed">{reaction.text}</p>
          <div className="flex items-center gap-2 mt-2 font-mono text-sm text-jsconf-muted">
            <span className="font-medium">{reaction.name}</span>
            <span>·</span>
            <span>{formatDistanceToNow(reaction.ts, { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
