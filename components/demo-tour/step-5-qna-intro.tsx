"use client"

import Link from "next/link"
import { StepShell, StepLabel, YellowButton, GhostButton } from "./primitives"

interface Step5QnaIntroProps {
  onNext: () => void
}

export function Step5QnaIntro({ onNext }: Step5QnaIntroProps) {
  return (
    <StepShell label="Step 5: Q&A introduction">
      <div className="flex-1 flex flex-col justify-center px-6 pb-6 gap-8 pt-6">
        <div className="flex flex-col gap-4">
          <StepLabel>Live Q&amp;A</StepLabel>
          <h2 className="font-display font-bold text-3xl uppercase tracking-tight leading-tight text-balance">
            Questions arrive<br />live to the speaker.
          </h2>
          <p className="font-sans text-base text-jsconf-muted leading-relaxed">
            As attendees type them, questions land directly on the speaker&apos;s
            screen in real time — no shouting, no awkward mic queues.
          </p>
          <p className="font-sans text-base text-jsconf-muted leading-relaxed">
            Then a dedicated Q&amp;A space puts the speaker in control: pick what to
            answer, see what the room is voting for, and manage the time however
            the moment calls for.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`h-0.5 flex-1 ${i < 5 ? "bg-jsconf-yellow" : "bg-jsconf-border"}`}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <YellowButton onClick={onNext}>See how it works →</YellowButton>
          <GhostButton href="/pricing">Check pricing</GhostButton>
        </div>
      </div>
    </StepShell>
  )
}
