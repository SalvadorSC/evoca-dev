"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ClientMessage } from "@/lib/types"

const EMOJI_OPTIONS = ["🔥", "🤯", "😂", "💀", "👏", "🚀"]

interface ReactTabProps {
  send: (message: ClientMessage) => void
}

export function ReactTab({ send }: ReactTabProps) {
  const [name, setName] = useState("")
  const [text, setText] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showValidation, setShowValidation] = useState(false)

  const missingEmoji = !selectedEmoji

  const handleSubmit = () => {
    if (missingEmoji) {
      setShowValidation(true)
      return
    }

    setIsSubmitting(true)

    send({
      type: "reaction",
      id: crypto.randomUUID(),
      name: name.trim() || "Anonymous",
      text: text.trim(),
      emoji: selectedEmoji,
      ts: Date.now(),
    })

    setText("")
    setSelectedEmoji(null)
    setIsSubmitting(false)
    setShowValidation(false)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Success message */}
      {submitted && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/30 text-green-400 font-mono text-sm">
          ✅ Reaction sent! Appearing on the wall now.
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="font-mono text-xs text-jsconf-muted uppercase tracking-wide">
          Your Name <span className="text-jsconf-muted normal-case">(optional)</span>
        </label>
        <Input
          id="name"
          placeholder="Anonymous"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-jsconf-surface border-jsconf-border rounded-none h-11 font-sans text-white placeholder:text-jsconf-muted focus:border-jsconf-yellow focus:ring-jsconf-yellow/20"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="reaction" className="font-mono text-xs uppercase tracking-wide flex items-center justify-between">
          <span className="text-jsconf-muted">
            Your Reaction <span className="normal-case font-sans font-normal">(optional)</span>
          </span>
          <span className="font-mono text-xs text-jsconf-muted normal-case">{text.length}/160</span>
        </label>
        <Textarea
          id="reaction"
          placeholder="Share your thoughts"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 160))}
          maxLength={160}
          className="bg-jsconf-surface rounded-none font-sans text-white placeholder:text-jsconf-muted resize-none transition-colors border-jsconf-border focus:border-jsconf-yellow focus:ring-jsconf-yellow/20"
          rows={3}
        />
        {text.trim() && (
          <p className="font-mono text-[10px] text-jsconf-muted">
            Your reaction will show as a text card on the wall.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-mono text-xs uppercase tracking-wide">
          <span className={showValidation && missingEmoji ? "text-jsconf-red" : "text-jsconf-muted"}>
            How are you feeling?
            {showValidation && missingEmoji && (
              <span className="ml-2 normal-case font-sans font-normal text-jsconf-red">← pick one!</span>
            )}
          </span>
        </label>
        <div className={`flex gap-2 flex-wrap p-2 border transition-colors ${showValidation && missingEmoji
          ? "border-jsconf-red bg-jsconf-red/5"
          : "border-transparent"
          }`}>
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setSelectedEmoji(emoji)
                if (showValidation) setShowValidation(false)
              }}
              className={`text-3xl p-3 rounded-none border transition-all duration-150 ${selectedEmoji === emoji
                ? "bg-jsconf-yellow-dim border-jsconf-yellow scale-110"
                : "bg-jsconf-surface border-jsconf-border hover:border-jsconf-yellow/50"
                }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full h-12 rounded-none bg-jsconf-yellow text-black font-display font-bold uppercase tracking-wide hover:bg-jsconf-yellow/90 disabled:opacity-40 disabled:cursor-not-allowed"
        size="lg"
      >
        {isSubmitting ? "Sending..." : "Send Reaction"}
      </Button>

      {/* Helper hint */}
      {!showValidation && missingEmoji && (
        <p className="text-center font-mono text-xs text-jsconf-muted">
          Pick an emoji to send your reaction
        </p>
      )}
    </div>
  )
}
