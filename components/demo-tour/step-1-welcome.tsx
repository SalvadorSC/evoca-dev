"use client"

import Link from "next/link"
import { StepShell, YellowButton, StepLabel } from "./primitives"

interface Step1WelcomeProps {
  onNext: () => void
  onSkip: () => void
}

export function Step1Welcome({ onNext, onSkip }: Step1WelcomeProps) {
  return (
    <StepShell label="Step 1: Welcome">
      {/* Skip */}
      <div className="flex justify-end px-5 pt-5">
        <button
          onClick={onSkip}
          className="font-mono text-xs text-jsconf-muted uppercase tracking-widest hover:text-foreground transition-colors py-1 px-2"
        >
          Skip tour
        </button>
      </div>

      {/* Main content — centred vertically in remaining space */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-6 gap-8">
        {/* Logo wordmark */}
        <div>
          <StepLabel>Interactive tour</StepLabel>
          <div className="mt-3">
            <span className="font-display font-bold text-4xl tracking-tight">
              Evo<span className="text-jsconf-yellow">ca</span>
            </span>
          </div>
        </div>

        {/* Headline + copy */}
        <div className="flex flex-col gap-4">
          <h1 className="font-display font-bold text-3xl uppercase tracking-tight leading-tight text-balance">
            Your audience,<br />on the same page.
          </h1>
          <p className="font-sans text-base text-jsconf-muted leading-relaxed">
            Evoca lets attendees react to your talk in real time — with emojis,
            text, and questions — displayed live on the speaker&apos;s wall.
            No app download, no sign-up. Just a link.
          </p>
          <p className="font-sans text-base text-jsconf-muted leading-relaxed">
            This 2-minute tour shows you exactly how it works.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`h-0.5 flex-1 ${i === 0 ? "bg-jsconf-yellow" : "bg-jsconf-border"}`}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <YellowButton onClick={onNext}>
            {"Let's go →"}
          </YellowButton>
          <p className="text-center font-mono text-xs text-jsconf-muted">
            Or{" "}
            <Link href="/pricing" className="text-jsconf-yellow underline-offset-2 hover:underline">
              go straight to pricing
            </Link>
          </p>
        </div>
      </div>
    </StepShell>
  )
}
