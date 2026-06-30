"use client"

import { useState, useEffect, useRef } from "react"
import { StepShell, StepLabel, FakeSlide, YellowButton } from "./primitives"

// A scripted feed that mirrors how reactions actually surface on the live wall:
// emoji-only reactions float up over the talk, reactions with text pop into the
// bottom-left corner. Each fires on its own beat so they appear "live".
const SCRIPT = [
  { id: "r1", emoji: "🔥", text: "This is exactly what we needed!", at: 600 },
  { id: "r2", emoji: "👏", text: "", at: 1300 },
  { id: "r3", emoji: "🤯", text: "Mind blown. Shipping this today.", at: 2100 },
  { id: "r4", emoji: "🚀", text: "", at: 2700 },
  { id: "r5", emoji: "💚", text: "When can I use this at my meetup?", at: 3500 },
  { id: "r6", emoji: "😂", text: "", at: 4100 },
]

interface FloatingEmoji {
  key: string
  emoji: string
  x: number
  rotation: number
}

interface TextCard {
  key: string
  emoji: string
  text: string
  slot: number
}

interface Step2WallProps {
  onNext: () => void
}

export function Step2Wall({ onNext }: Step2WallProps) {
  const [floating, setFloating] = useState<FloatingEmoji[]>([])
  const [cards, setCards] = useState<TextCard[]>([])
  const [ctaVisible, setCtaVisible] = useState(false)
  const slotRef = useRef(0)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    SCRIPT.forEach((r) => {
      timers.push(
        setTimeout(() => {
          if (r.text) {
            // Text reaction → bottom-left card (auto-fades after 4s)
            const slot = slotRef.current % 3
            slotRef.current += 1
            const key = `${r.id}-${Date.now()}`
            setCards((prev) => [...prev, { key, emoji: r.emoji, text: r.text, slot }])
            timers.push(
              setTimeout(() => setCards((prev) => prev.filter((c) => c.key !== key)), 4000),
            )
          } else {
            // Emoji-only → floats up (auto-removes after 2.8s)
            const key = `${r.id}-${Date.now()}`
            const x = 10 + Math.random() * 80
            const rotation = -15 + Math.random() * 30
            setFloating((prev) => [...prev, { key, emoji: r.emoji, x, rotation }])
            timers.push(
              setTimeout(() => setFloating((prev) => prev.filter((e) => e.key !== key)), 2800),
            )
          }
        }, r.at),
      )
    })

    const lastAt = SCRIPT[SCRIPT.length - 1].at
    timers.push(setTimeout(() => setCtaVisible(true), lastAt + 700))

    return () => timers.forEach(clearTimeout)
  }, [])

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

        {/* Full-width talk stage with reactions overlaying it */}
        <div className="relative flex-1 overflow-hidden border border-jsconf-border">
          {/* The talk fills the stage */}
          <FakeSlide showProgress={false} showHeader={false} />

          {/* Floating emoji layer — rises over the lower half of the stage */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 top-1/2 overflow-hidden">
            {floating.map((item) => (
              <span
                key={item.key}
                className="absolute animate-tour-emoji-float text-3xl"
                style={
                  {
                    left: `${item.x}%`,
                    bottom: 0,
                    transform: `rotate(${item.rotation}deg)`,
                    "--rot": `${item.rotation}deg`,
                  } as React.CSSProperties
                }
              >
                {item.emoji}
              </span>
            ))}
          </div>

          {/* Text reaction cards — bottom-left stack, exactly like the real wall */}
          <div
            className="pointer-events-none absolute"
            style={{ bottom: "12px", left: "12px", width: "75%" }}
          >
            {cards.map((card) => (
              <div
                key={card.key}
                className="absolute animate-tour-card-in"
                style={{ bottom: `${card.slot * 44}px` }}
              >
                <div
                  className="flex items-center gap-2 px-2.5 py-1.5"
                  style={{
                    background: "rgba(17,17,17,0.92)",
                    border: "1px solid #2a2a2a",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <span className="text-sm leading-none shrink-0">{card.emoji}</span>
                  <span className="font-sans text-xs text-white truncate leading-snug">
                    {card.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="font-mono text-xs text-jsconf-muted text-center text-balance">
          Every reaction the audience sends lands here in real time.
        </p>

        {/* CTA */}
        {ctaVisible && (
          <div className="animate-in fade-in duration-500">
            <YellowButton onClick={onNext}>{"That's you next →"}</YellowButton>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes tour-emoji-float {
          0% {
            transform: translateY(0) rotate(var(--rot, 0deg));
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100%) rotate(var(--rot, 0deg));
            opacity: 0;
          }
        }
        .animate-tour-emoji-float {
          animation: tour-emoji-float 2.8s ease-out forwards;
        }

        @keyframes tour-card-in {
          0% {
            opacity: 0;
            transform: translateX(-12px);
          }
          10% {
            opacity: 1;
            transform: translateX(0);
          }
          75% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateX(-8px);
          }
        }
        .animate-tour-card-in {
          animation: tour-card-in 4s ease-out forwards;
        }
      `}</style>
    </StepShell>
  )
}
