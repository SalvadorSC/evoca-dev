"use client"

import { useEffect } from "react"
import Link from "next/link"
import { StepShell } from "./primitives"

export function Step7Finish() {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let confetti: ((opts: any) => void) | null = null

    async function fire() {
      const mod = await import("canvas-confetti")
      // canvas-confetti exports the function as both default and module.exports
      confetti = (mod.default ?? mod) as typeof confetti

      const colors = ["#F7E018", "#FFFFFF", "#080808"]

      confetti?.({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
        colors,
        gravity: 0.9,
        scalar: 1.1,
      })

      setTimeout(() => {
        confetti?.({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.4, x: 0.2 },
          colors,
          gravity: 0.8,
        })
        confetti?.({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.4, x: 0.8 },
          colors,
          gravity: 0.8,
        })
      }, 300)
    }

    fire()
  }, [])

  return (
    <StepShell label="Step 7: Tour complete">
      <div className="flex-1 flex flex-col justify-center px-6 pb-10 gap-8 pt-6">
        {/* Headline */}
        <div className="flex flex-col gap-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-jsconf-muted">
            Tour complete
          </span>
          <h2 className="font-display font-bold text-4xl uppercase tracking-tight leading-tight text-balance">
            You&apos;re all caught up.
          </h2>
          <p className="font-sans text-base text-jsconf-muted leading-relaxed">
            That&apos;s Evoca — real-time reactions and live Q&A for any talk or
            conference. Free forever for speakers, pay only when you scale.
          </p>
        </div>

        {/* Step bar — all filled */}
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-0.5 flex-1 bg-jsconf-yellow" />
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full py-4 bg-jsconf-yellow text-black font-display font-bold text-sm uppercase tracking-wider text-center block active:scale-[0.98] transition-transform"
          >
            Start for free
          </Link>
          <Link
            href="/pricing"
            className="w-full py-4 border border-jsconf-border text-jsconf-muted font-display font-bold text-sm uppercase tracking-wider text-center block hover:border-jsconf-yellow hover:text-foreground transition-colors active:scale-[0.98]"
          >
            See pricing
          </Link>
        </div>

        {/* Logo */}
        <div className="mt-auto text-center">
          <span className="font-display font-bold text-2xl tracking-tight text-jsconf-muted">
            Evo<span className="text-jsconf-yellow">ca</span>
          </span>
        </div>
      </div>
    </StepShell>
  )
}
