"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import type { Reaction } from "@/lib/types"

interface FloatingEmoji {
  id: string
  emoji: string
  x: number
  rotation: number
}

interface TextReactionCard {
  id: string
  emoji: string
  text: string
  // vertical slot 0–4 so cards don't all stack at the same Y
  slot: number
}

interface EmojiBurstProps {
  reactions: Reaction[]
  isQAMode: boolean
}

const CARD_SLOTS = 5

export function EmojiBurst({ reactions, isQAMode }: EmojiBurstProps) {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([])
  const [textCards, setTextCards] = useState<TextReactionCard[]>([])
  const processedIds = useRef(new Set<string>())
  // Ignore reactions that were already in state before we mounted
  const mountedAt = useRef(Date.now())
  // Round-robin slot counter for text cards
  const slotRef = useRef(0)

  const spawnEmoji = useCallback((emoji: string, id: string) => {
    const x = isQAMode
      ? Math.random() > 0.5 ? 5 + Math.random() * 8 : 87 + Math.random() * 8
      : 10 + Math.random() * 80
    const rotation = -15 + Math.random() * 30

    const item: FloatingEmoji = { id: `${id}-${Date.now()}`, emoji, x, rotation }
    setFloatingEmojis((prev) => [...prev, item])
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== item.id))
    }, 2800)
  }, [isQAMode])

  const spawnTextCard = useCallback((emoji: string, text: string, id: string) => {
    const slot = slotRef.current % CARD_SLOTS
    slotRef.current += 1
    const card: TextReactionCard = { id: `tc-${id}-${Date.now()}`, emoji, text, slot }
    setTextCards((prev) => [...prev, card])
    setTimeout(() => {
      setTextCards((prev) => prev.filter((c) => c.id !== card.id))
    }, 4000)
  }, [])

  useEffect(() => {
    reactions.forEach((reaction) => {
      if (processedIds.current.has(reaction.id)) return
      processedIds.current.add(reaction.id)
      if (reaction.ts < mountedAt.current) return
      if (reaction.flags >= 3) return

      if (reaction.text?.trim()) {
        // Has text — show as fade-away card, no floating emoji
        spawnTextCard(reaction.emoji, reaction.text.trim(), reaction.id)
      } else {
        // Emoji-only — float up
        spawnEmoji(reaction.emoji, reaction.id)
      }
    })
  }, [reactions, spawnEmoji, spawnTextCard])

  return (
    <>
      {/* Floating emoji layer — capped at 50vh */}
      <div
        className="fixed inset-x-0 pointer-events-none overflow-hidden"
        style={{ bottom: 0, top: "50%", zIndex: 50 }}
      >
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className="absolute animate-emoji-float"
            style={{
              left: `${item.x}%`,
              bottom: 0,
              fontSize: isQAMode ? "1.5rem" : "2rem",
              transform: `rotate(${item.rotation}deg)`,
              "--rot": `${item.rotation}deg`,
            } as React.CSSProperties}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Text reaction cards — bottom-left stack */}
      <div
        className="fixed pointer-events-none"
        style={{ bottom: "80px", left: "16px", zIndex: 50, width: "260px" }}
      >
        {textCards.map((card) => (
          <div
            key={card.id}
            className="absolute animate-text-card-in"
            style={{ bottom: `${card.slot * 56}px` }}
          >
            <div
              className="flex items-center gap-2 px-3 py-2"
              style={{
                background: "rgba(17,17,17,0.92)",
                border: "1px solid #2a2a2a",
                backdropFilter: "blur(8px)",
                maxWidth: "260px",
              }}
            >
              <span style={{ fontSize: "1rem", lineHeight: 1 }}>{card.emoji}</span>
              <span
                className="font-sans text-white truncate"
                style={{ fontSize: "1rem", lineHeight: 1.4 }}
              >
                {card.text}
              </span>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes emoji-float {
          0%   { transform: translateY(0)     rotate(var(--rot, 0deg)); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(-50vh) rotate(var(--rot, 0deg)); opacity: 0; }
        }
        .animate-emoji-float {
          animation: emoji-float 2.8s ease-out forwards;
        }

        @keyframes text-card-in {
          0%   { opacity: 0; transform: translateX(-12px); }
          10%  { opacity: 1; transform: translateX(0); }
          70%  { opacity: 1; }
          100% { opacity: 0; transform: translateX(-8px); }
        }
        .animate-text-card-in {
          animation: text-card-in 4s ease-out forwards;
        }
      `}</style>
    </>
  )
}
