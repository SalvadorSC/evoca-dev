"use client"

import { ChevronUp, Check } from "lucide-react"
import type { Question } from "@/lib/types"

// ─── Attendee variant (vote button + answered badge) ─────────────────────────

interface AttendeeQuestionCardProps {
  question: Question
  voted: boolean
  onVote: (id: string) => void
}

export function AttendeeQuestionCard({
  question,
  voted,
  onVote,
}: AttendeeQuestionCardProps) {
  return (
    <div
      className={`bg-jsconf-surface border border-jsconf-border p-3 flex gap-3 items-start transition-opacity duration-150 ${
        question.answered ? "opacity-50" : ""
      }`}
    >
      <button
        onClick={() => onVote(question.id)}
        disabled={voted}
        className={`flex flex-col items-center gap-0.5 p-2 border transition-all duration-150 ${
          voted
            ? "text-jsconf-yellow bg-jsconf-yellow-dim border-jsconf-yellow"
            : "text-jsconf-muted border-jsconf-border hover:text-jsconf-yellow hover:border-jsconf-yellow"
        }`}
      >
        <ChevronUp className="h-4 w-4" />
        <span className="font-mono text-sm font-bold">{question.votes}</span>
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-sans">{question.text}</p>
        <p className="font-mono text-xs text-jsconf-muted mt-1">{question.name}</p>
      </div>

      {question.answered && (
        <span className="flex items-center gap-1 font-mono text-xs text-green-500 bg-green-500/10 px-2 py-1 uppercase tracking-wide">
          <Check className="h-3 w-3" />
          Answered
        </span>
      )}
    </div>
  )
}

// ─── Presenter variant (compact with dismiss action) ─────────────────────────

interface PresenterQuestionCardProps {
  question: Question
  onDismiss: (id: string) => void
}

export function PresenterQuestionCard({
  question,
  onDismiss,
}: PresenterQuestionCardProps) {
  return (
    <div
      className="flex flex-col gap-2 p-3"
      style={{ border: "1px solid #2a2a2a" }}
    >
      <div className="flex items-start gap-3">
        <span className="font-mono text-2xl font-bold text-jsconf-yellow leading-none shrink-0">
          {question.votes}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-sans leading-relaxed">{question.text}</p>
          <p className="font-mono text-[10px] text-jsconf-muted mt-1">{question.name}</p>
        </div>
      </div>
      <button
        onClick={() => onDismiss(question.id)}
        className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-jsconf-muted border border-[#2a2a2a] px-2 py-1 hover:border-green-500 hover:text-green-400 transition-colors self-start"
      >
        <Check className="h-3 w-3" />
        Mark as read
      </button>
    </div>
  )
}
