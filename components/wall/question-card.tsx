"use client"

import { ChevronUp } from "lucide-react"
import type { Question } from "@/lib/types"

interface QuestionCardProps {
  question: Question
  rank: number
}

export function QuestionCard({ question, rank }: QuestionCardProps) {
  const isTopQuestion = rank === 1

  return (
    <div 
      className={`bg-jsconf-surface border p-5 transition-all duration-300 ${
        isTopQuestion 
          ? "border-jsconf-yellow shadow-[0_0_0_1px_var(--jsconf-yellow)]" 
          : "border-jsconf-border"
      }`}
    >
      <div className="flex items-start gap-5">
        {/* Vote count - large monospace yellow on left */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <ChevronUp className="h-6 w-6 text-jsconf-yellow" />
          <span className="font-mono text-3xl font-bold text-jsconf-yellow">{question.votes}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xl text-white font-sans leading-relaxed">{question.text}</p>
          <p className="font-mono text-sm text-jsconf-muted mt-2">{question.name}</p>
        </div>
        
        {/* Rank badge */}
        <div className="flex items-center justify-center w-10 h-10 bg-jsconf-surface-2 border border-jsconf-border font-mono font-bold text-jsconf-muted text-lg">
          #{rank}
        </div>
      </div>
    </div>
  )
}
