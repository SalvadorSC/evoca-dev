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
  /**
   * When true, the burst is positioned `absolute` within the nearest
   * positioned ancestor (e.g. a slide preview) instead of `fixed` to the
   * viewport. Used by the demo tour to render the real wall behaviour inside
   * the mini talk stage.
   */
  contained?: boolean
  /** Multiplier applied to emoji/card sizing. Defaults to 1 (real wall). */
  scale?: number
}

const CARD_SLOTS = 5

export function EmojiBurst({ reactions, isQAMode, contained = false, scale = 1 }: EmojiBurstProps) {
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
      : contained
        ? 4 + Math.random() * 34 // contained: cluster on the left side only
        : 10 + Math.random() * 80
    const rotation = -15 + Math.random() * 30

    const item: FloatingEmoji = { id: `${id}-${Date.now()}`, emoji, x, rotation }
    setFloatingEmojis((prev) => [...prev, item])
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== item.id))
    }, 2800)
  }, [isQAMode, contained])

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

  const positionClass = contained ? "absolute" : "fixed"
  const floatAnimClass = contained ? "animate-emoji-float-contained" : "animate-emoji-float"
  const cardAnimClass = contained ? "animate-text-card-in-contained" : "animate-text-card-in"

  const baseEmojiRem = contained ? 1.25 : isQAMode ? 1.5 : 2
  const cardSlotGap = (contained ? 40 : 56) * scale
  const cardMaxWidth = contained ? "82%" : `${260 * scale}px`

  return (
    <>
      {/* Floating emoji layer */}
      <div
        className={`${positionClass} inset-x-0 pointer-events-none overflow-hidden`}
        style={
          contained
            ? // Only the bottom 40% of the slide — emojis rise from the bottom
              // and are clipped (disappear) around the 40% height line. Sits
              // behind the text cards (lower z-index).
              { top: "60%", bottom: 0, left: 0, right: 0, zIndex: 1 }
            : { bottom: 0, top: "50%", zIndex: 50 }
        }
      >
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className={`absolute ${floatAnimClass}`}
            style={{
              left: `${item.x}%`,
              bottom: 0,
              fontSize: `${baseEmojiRem * scale}rem`,
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
        className={`${positionClass} pointer-events-none`}
        style={
          contained
            ? { bottom: `${10 * scale}px`, left: `${10 * scale}px`, width: "82%", zIndex: 2 }
            : { bottom: "80px", left: "16px", zIndex: 50, width: `${260 * scale}px` }
        }
      >
        {textCards.map((card) => (
          <div
            key={card.id}
            className={`absolute ${cardAnimClass}`}
            style={{ bottom: `${card.slot * cardSlotGap}px` }}
          >
            <div
              className="flex items-start gap-2"
              style={{
                background: "rgba(17,17,17,0.92)",
                border: "1px solid #2a2a2a",
                backdropFilter: "blur(8px)",
                maxWidth: cardMaxWidth,
                padding: `${8 * scale}px ${12 * scale}px`,
              }}
            >
              <span style={{ fontSize: `${1 * scale}rem`, lineHeight: 1.4 }}>{card.emoji}</span>
              <span
                className="font-sans text-white"
                style={{ fontSize: `${1 * scale}rem`, lineHeight: 1.4, wordBreak: "break-word" }}
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

        @keyframes emoji-float-contained {
          0%   { transform: translateY(0)      rotate(var(--rot, 0deg)); opacity: 1; }
          70%  { opacity: 1; }
          100% { transform: translateY(-90px)  rotate(var(--rot, 0deg)); opacity: 0; }
        }
        .animate-emoji-float-contained {
          animation: emoji-float-contained 2.8s ease-out forwards;
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
        .animate-text-card-in-contained {
          animation: text-card-in 4s ease-out forwards;
        }
      `}</style>
    </>
  )
}
