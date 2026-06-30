"use client"

import { type ReactNode } from "react"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserReaction {
  name: string
  text: string
  emoji: string
}

// ─── TourProgress ─────────────────────────────────────────────────────────────
// Thin yellow bar at the very top. Always rendered above the step content.

interface TourProgressProps {
  step: number // 0-indexed
  total: number
}

export function TourProgress({ step, total }: TourProgressProps) {
  const pct = ((step + 1) / total) * 100
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-jsconf-surface"
      role="progressbar"
      aria-valuenow={step + 1}
      aria-valuemax={total}
      aria-label={`Tour progress: step ${step + 1} of ${total}`}
    >
      <div
        className="h-full bg-jsconf-yellow transition-all duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
      <span className="sr-only">
        Step {step + 1} of {total}
      </span>
    </div>
  )
}

// ─── StepShell ────────────────────────────────────────────────────────────────
// Full-screen wrapper every step mounts inside. key={step} on the outer
// DemoTour triggers unmount/remount which fires the enter animation.

interface StepShellProps {
  label: string
  children: ReactNode
  className?: string
  scrollable?: boolean
}

export function StepShell({ label, children, className = "", scrollable = false }: StepShellProps) {
  return (
    <section
      aria-label={label}
      className={`flex flex-col w-full bg-jsconf-bg text-foreground animate-in slide-in-from-bottom-4 duration-300 ${
        scrollable ? "overflow-y-auto" : "overflow-hidden"
      } ${className}`}
      style={{ height: "100dvh", paddingTop: "2px" /* progress bar height */ }}
    >
      {children}
    </section>
  )
}

// ─── HighlightRing ────────────────────────────────────────────────────────────
// Pulsing yellow border overlay. Wrap the target element with this.

interface HighlightRingProps {
  active: boolean
  label: string
  labelPosition?: "top" | "bottom"
  children: ReactNode
}

export function HighlightRing({
  active,
  label,
  labelPosition = "bottom",
  children,
}: HighlightRingProps) {
  return (
    <div className="relative">
      {children}
      {active && (
        <>
          <div
            className="pointer-events-none absolute inset-0 border-2 border-jsconf-yellow animate-pulse z-10"
            aria-hidden="true"
          />
          <div
            className={`absolute ${
              labelPosition === "top" ? "bottom-full mb-2" : "top-full mt-2"
            } left-0 right-0 flex justify-center z-20 pointer-events-none`}
          >
            <span className="bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider px-2 py-1 text-center">
              {label}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

// ─── FakeSlide ────────────────────────────────────────────────────────────────
// Mimics the speaker's presentation slide for the wall steps.

interface FakeSlideProps {
  title?: string
  speaker?: string
  progress?: number // 0–100
  showProgress?: boolean
}

export function FakeSlide({
  title = "Building Real-time Experiences at Scale",
  speaker = "Alex Rivera",
  progress = 62,
  showProgress = true,
}: FakeSlideProps) {
  return (
    <div className="bg-jsconf-surface border border-jsconf-border p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-jsconf-muted">
          Live Presentation
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-jsconf-yellow uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-jsconf-yellow animate-pulse" />
          Live
        </span>
      </div>

      <div className="bg-jsconf-surface-2 border border-jsconf-border aspect-video flex flex-col items-center justify-center gap-3 px-4">
        <p className="font-display font-bold text-base text-center text-white leading-snug text-balance uppercase tracking-wide">
          {title}
        </p>
        <p className="font-mono text-xs text-jsconf-muted">{speaker}</p>
      </div>

      {/* Progress bar */}
      {showProgress && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-0.5 bg-jsconf-border">
            <div
              className="h-full bg-jsconf-yellow transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-jsconf-muted shrink-0">{progress}%</span>
        </div>
      )}
    </div>
  )
}

// ─── StepLabel ────────────────────────────────────────────────────────────────

export function StepLabel({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-widest text-jsconf-muted">
      {children}
    </span>
  )
}

// ─── YellowButton ─────────────────────────────────────────────────────────────

interface YellowButtonProps {
  onClick: () => void
  children: ReactNode
  className?: string
  disabled?: boolean
}

export function YellowButton({ onClick, children, className = "", disabled = false }: YellowButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 bg-jsconf-yellow text-black font-display font-bold text-sm uppercase tracking-wider disabled:opacity-40 active:scale-[0.98] transition-transform ${className}`}
    >
      {children}
    </button>
  )
}

// ─── GhostButton ──────────────────────────────────────────────────────────────

interface GhostButtonProps {
  onClick?: () => void
  href?: string
  children: ReactNode
  className?: string
}

export function GhostButton({ onClick, href, children, className = "" }: GhostButtonProps) {
  const cls = `w-full py-4 border border-jsconf-border text-jsconf-muted font-display font-bold text-sm uppercase tracking-wider hover:border-jsconf-yellow hover:text-foreground transition-colors active:scale-[0.98] transition-transform text-center block ${className}`
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    )
  }
  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  )
}
