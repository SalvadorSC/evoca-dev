"use client"

import { useState } from "react"
import { StepShell, StepLabel, HighlightRing, YellowButton } from "./primitives"
import type { UserReaction } from "./primitives"

const EMOJI_OPTIONS = ["🔥", "🤯", "😂", "💀", "👏", "🚀"]

type SubStep = "name" | "emoji" | "text" | "send"

interface Step3ReactProps {
  onReactionSent: (r: UserReaction) => void
}

export function Step3React({ onReactionSent }: Step3ReactProps) {
  const [subStep, setSubStep] = useState<SubStep>("name")
  const [name, setName] = useState("")
  const [text, setText] = useState("")
  const [emoji, setEmoji] = useState<string | null>(null)

  const subStepLabels: Record<SubStep, string> = {
    name: "1 / 4 — Add your name",
    emoji: "2 / 4 — Pick an emoji",
    text: "3 / 4 — Add a thought",
    send: "4 / 4 — Send it",
  }

  const handleEmojiPick = (e: string) => {
    setEmoji(e)
    setSubStep("text")
  }

  const handleTextStep = () => {
    setSubStep("send")
  }

  const handleSubmit = () => {
    if (!emoji) return
    onReactionSent({
      name: name.trim() || "Anonymous",
      text: text.trim(),
      emoji,
    })
  }

  return (
    <StepShell label="Step 3: Post a reaction" scrollable>
      <div className="flex flex-col gap-5 p-5 pb-8 min-h-full">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <StepLabel>Attendee view</StepLabel>
          <h2 className="font-display font-bold text-xl uppercase tracking-tight">
            Your turn to react
          </h2>
        </div>

        {/* Sub-step badge */}
        <div className="bg-jsconf-yellow-dim border border-jsconf-yellow/30 px-3 py-2">
          <p className="font-mono text-xs text-jsconf-yellow font-bold uppercase tracking-wider">
            {subStepLabels[subStep]}
          </p>
        </div>

        {/* Name field */}
        <div className="flex flex-col gap-2">
          <HighlightRing
            active={subStep === "name"}
            label="Add your name (optional)"
            labelPosition="bottom"
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="tour-name" className="font-mono text-xs uppercase tracking-wide text-jsconf-muted">
                Your name <span className="normal-case font-sans text-jsconf-muted font-normal">(optional)</span>
              </label>
              <input
                id="tour-name"
                placeholder="Anonymous"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-jsconf-surface border border-jsconf-border h-11 px-3 font-sans text-sm text-foreground placeholder:text-jsconf-muted focus:outline-none focus:border-jsconf-yellow"
              />
            </div>
          </HighlightRing>

          {subStep === "name" && (
            <button
              onClick={() => setSubStep("emoji")}
              className="self-start font-mono text-xs text-jsconf-muted hover:text-foreground underline-offset-2 hover:underline"
            >
              {name.trim() ? "Continue →" : "Skip name →"}
            </button>
          )}
        </div>

        {/* Emoji grid */}
        <div className="flex flex-col gap-2">
          <HighlightRing
            active={subStep === "emoji"}
            label="Pick how you feel"
            labelPosition="bottom"
          >
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs uppercase tracking-wide text-jsconf-muted">
                How are you feeling?
              </label>
              <div className="grid grid-cols-6 gap-2">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => handleEmojiPick(e)}
                    className={`text-2xl p-3 border transition-all duration-150 ${
                      emoji === e
                        ? "bg-jsconf-yellow-dim border-jsconf-yellow scale-110"
                        : "bg-jsconf-surface border-jsconf-border hover:border-jsconf-yellow/50"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </HighlightRing>
        </div>

        {/* Text field */}
        <div className="flex flex-col gap-2">
          <HighlightRing
            active={subStep === "text"}
            label="Add a thought (optional)"
            labelPosition="bottom"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="tour-text" className="font-mono text-xs uppercase tracking-wide text-jsconf-muted flex justify-between">
                <span>Your reaction <span className="normal-case font-sans font-normal">(optional)</span></span>
                <span>{text.length}/160</span>
              </label>
              <textarea
                id="tour-text"
                placeholder="Share your thoughts"
                value={text}
                onFocus={() => subStep === "text" && setSubStep("text")}
                onChange={(e) => setText(e.target.value.slice(0, 160))}
                className="bg-jsconf-surface border border-jsconf-border px-3 py-2 font-sans text-sm text-foreground placeholder:text-jsconf-muted focus:outline-none focus:border-jsconf-yellow resize-none"
                rows={3}
              />
            </div>
          </HighlightRing>

          {subStep === "text" && (
            <button
              onClick={handleTextStep}
              className="self-start font-mono text-xs text-jsconf-muted hover:text-foreground underline-offset-2 hover:underline"
            >
              Skip text →
            </button>
          )}
        </div>

        {/* Send button */}
        <div className="mt-auto">
          <HighlightRing active={subStep === "send"} label="Send your reaction" labelPosition="top">
            <YellowButton
              onClick={handleSubmit}
              disabled={!emoji}
            >
              Send Reaction
            </YellowButton>
          </HighlightRing>
          {!emoji && subStep !== "emoji" && (
            <p className="text-center font-mono text-xs text-jsconf-muted mt-2">
              Pick an emoji first
            </p>
          )}
        </div>
      </div>
    </StepShell>
  )
}
