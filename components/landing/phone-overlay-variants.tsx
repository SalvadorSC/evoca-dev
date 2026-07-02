"use client"

/**
 * Four visual treatments for the SimOverlay inside the InteractivePhoneMockup.
 * Each renders the same fields (name, reaction text, emoji picker, CTA) in a
 * different design system so the landing VariantPicker can switch between them.
 */

import type { VariantId } from "./variant-picker"

interface SimState {
  active: boolean
  tab: "react" | "ask"
  name: string
  typedName: string
  text: string
  typedText: string
  emoji: string | null
  phase: "typing-name" | "typing-text" | "picking-emoji" | "sending" | "done"
}

const EMOJI_OPTIONS = ["🔥", "🤯", "😂", "💀", "👏", "🚀"]

interface Props {
  sim: SimState
  variant: VariantId
}

export function PhoneOverlay({ sim, variant }: Props) {
  if (variant === "B") return <OverlayB sim={sim} />
  if (variant === "C") return <OverlayC sim={sim} />
  if (variant === "D") return <OverlayD sim={sim} />
  return <OverlayA sim={sim} />
}

// ─── Shared scale wrapper (mirrors the real ReactTab transform) ────────────────
function ScaleWrap({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ transform: "scale(0.82)", transformOrigin: "top center", width: "122%", marginLeft: "-11%" }}
    >
      {children}
    </div>
  )
}

// ─── Variant A — Current: JSConf dark + yellow ─────────────────────────────────
function OverlayA({ sim }: { sim: SimState }) {
  const isTypingName = sim.phase === "typing-name"
  const isTypingText = sim.phase === "typing-text"
  const isSending = sim.phase === "sending" || sim.phase === "done"

  return (
    <ScaleWrap>
      <div className="flex flex-col gap-5 pb-4 bg-jsconf-bg min-h-full">
        {/* Name */}
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs text-jsconf-muted uppercase tracking-wide">
            Your Name <span className="normal-case">(optional)</span>
          </label>
          <div className={`bg-jsconf-surface border h-11 flex items-center px-3 font-sans text-sm ${isTypingName && sim.typedName ? "border-jsconf-yellow" : "border-jsconf-border"}`}>
            {sim.typedName ? <span className="text-foreground">{sim.typedName}</span> : <span className="text-jsconf-muted">Anonymous</span>}
            {isTypingName && sim.typedName && <span className="inline-block w-[2px] h-[14px] bg-jsconf-yellow ml-[1px] animate-pulse" />}
          </div>
        </div>
        {/* Reaction */}
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs text-jsconf-muted uppercase tracking-wide flex justify-between">
            <span>Your Reaction <span className="normal-case font-sans font-normal">(optional)</span></span>
            <span>{sim.typedText.length}/160</span>
          </label>
          <div className={`bg-jsconf-surface border px-3 py-2 font-sans text-sm min-h-[72px] ${isTypingText ? "border-jsconf-yellow" : "border-jsconf-border"}`}>
            {sim.typedText ? <span className="text-foreground">{sim.typedText}</span> : <span className="text-jsconf-muted">Share your thoughts</span>}
            {isTypingText && sim.typedText && <span className="inline-block w-[2px] h-[14px] bg-jsconf-yellow ml-[1px] animate-pulse" />}
          </div>
        </div>
        {/* Emoji picker */}
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs text-jsconf-muted uppercase tracking-wide">How are you feeling?</label>
          <div className="flex gap-2 flex-wrap p-2">
            {EMOJI_OPTIONS.map((e) => (
              <div key={e} className={`text-3xl p-3 border transition-all duration-150 ${sim.emoji === e ? "bg-jsconf-yellow-dim border-jsconf-yellow scale-110" : "bg-jsconf-surface border-jsconf-border"}`}>{e}</div>
            ))}
          </div>
        </div>
        {/* CTA */}
        <div className="w-full h-12 flex items-center justify-center font-display font-bold uppercase tracking-wide text-sm bg-jsconf-yellow text-black">
          {sim.phase === "done" ? "Sent!" : sim.emoji ? `Send ${sim.emoji}` : "Send Reaction"}
        </div>
      </div>
    </ScaleWrap>
  )
}

// ─── Variant B — Clean: white card, rounded, emerald accent ───────────────────
function OverlayB({ sim }: { sim: SimState }) {
  const isTypingName = sim.phase === "typing-name"
  const isTypingText = sim.phase === "typing-text"

  return (
    <ScaleWrap>
      <div className="flex flex-col gap-4 pb-4 bg-white min-h-full px-1">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Name</label>
          <div className={`border rounded-lg h-10 flex items-center px-3 text-sm transition-colors ${isTypingName && sim.typedName ? "border-emerald-400 bg-emerald-50" : "border-gray-200 bg-gray-50"}`}>
            {sim.typedName ? <span className="text-gray-800">{sim.typedName}</span> : <span className="text-gray-400">Anonymous</span>}
            {isTypingName && sim.typedName && <span className="inline-block w-[2px] h-[13px] bg-emerald-500 ml-[1px] animate-pulse" />}
          </div>
        </div>
        {/* Message */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest flex justify-between">
            <span>Message</span>
            <span className="text-gray-300">{sim.typedText.length}/160</span>
          </label>
          <div className={`border rounded-lg px-3 py-2 text-sm min-h-[68px] transition-colors ${isTypingText ? "border-emerald-400 bg-emerald-50" : "border-gray-200 bg-gray-50"}`}>
            {sim.typedText ? <span className="text-gray-800">{sim.typedText}</span> : <span className="text-gray-400">Say something...</span>}
            {isTypingText && sim.typedText && <span className="inline-block w-[2px] h-[13px] bg-emerald-500 ml-[1px] animate-pulse" />}
          </div>
        </div>
        {/* Emoji */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Feeling</label>
          <div className="grid grid-cols-3 gap-2">
            {EMOJI_OPTIONS.map((e) => (
              <div key={e} className={`flex items-center justify-center text-2xl py-2 rounded-xl border transition-all duration-150 ${sim.emoji === e ? "border-emerald-400 bg-emerald-50 scale-110 shadow-sm" : "border-gray-100 bg-gray-50"}`}>{e}</div>
            ))}
          </div>
        </div>
        {/* CTA */}
        <div className={`w-full h-11 flex items-center justify-center rounded-xl font-semibold text-sm transition-colors ${sim.phase === "done" ? "bg-emerald-100 text-emerald-600" : sim.emoji ? "bg-emerald-500 text-white shadow-md" : "bg-gray-100 text-gray-400"}`}>
          {sim.phase === "done" ? "Sent!" : sim.emoji ? `React ${sim.emoji}` : "Pick a reaction"}
        </div>
      </div>
    </ScaleWrap>
  )
}

// ─── Variant C — Neon: deep indigo, pill buttons, gradient CTA ────────────────
function OverlayC({ sim }: { sim: SimState }) {
  const isTypingName = sim.phase === "typing-name"
  const isTypingText = sim.phase === "typing-text"

  return (
    <ScaleWrap>
      <div className="flex flex-col gap-4 pb-4 min-h-full" style={{ background: "#0f0c1a" }}>
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">/ name</label>
          <div className={`h-10 flex items-center px-3 text-sm rounded-full border transition-colors ${isTypingName && sim.typedName ? "border-purple-500 bg-purple-900/30" : "border-white/10 bg-white/5"}`}>
            {sim.typedName ? <span className="text-white">{sim.typedName}</span> : <span className="text-white/30">Anonymous</span>}
            {isTypingName && sim.typedName && <span className="inline-block w-[2px] h-[13px] bg-purple-400 ml-[1px] animate-pulse" />}
          </div>
        </div>
        {/* Message */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono text-purple-400 uppercase tracking-widest flex justify-between">
            <span>/ message</span>
            <span className="text-white/20">{sim.typedText.length}/160</span>
          </label>
          <div className={`rounded-2xl px-3 py-2 text-sm min-h-[64px] border transition-colors ${isTypingText ? "border-purple-500 bg-purple-900/30" : "border-white/10 bg-white/5"}`}>
            {sim.typedText ? <span className="text-white/90">{sim.typedText}</span> : <span className="text-white/20">Drop a thought...</span>}
            {isTypingText && sim.typedText && <span className="inline-block w-[2px] h-[13px] bg-purple-400 ml-[1px] animate-pulse" />}
          </div>
        </div>
        {/* Emoji pills */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">/ vibe</label>
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_OPTIONS.map((e) => (
              <div key={e} className={`text-xl px-3 py-1.5 rounded-full border transition-all duration-150 ${sim.emoji === e ? "border-purple-400 bg-purple-500/30 scale-110 shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "border-white/10 bg-white/5"}`}>{e}</div>
            ))}
          </div>
        </div>
        {/* Gradient CTA */}
        <div
          className="w-full h-11 flex items-center justify-center font-bold text-sm rounded-full text-white transition-opacity"
          style={{ background: sim.emoji ? "linear-gradient(135deg,#7c3aed,#ec4899)" : "rgba(255,255,255,0.06)" }}
        >
          {sim.phase === "done" ? "Sent!" : sim.emoji ? `Send it ${sim.emoji}` : "Choose a vibe first"}
        </div>
      </div>
    </ScaleWrap>
  )
}

// ─── Variant D — Brutal: stark white bg, red accent, oversized type ───────────
function OverlayD({ sim }: { sim: SimState }) {
  const isTypingName = sim.phase === "typing-name"
  const isTypingText = sim.phase === "typing-text"

  return (
    <ScaleWrap>
      <div className="flex flex-col gap-4 pb-4 bg-white min-h-full">
        {/* Name */}
        <div className="flex flex-col gap-0">
          <label className="text-[9px] font-black text-red-600 uppercase tracking-[0.2em]">NAME</label>
          <div className={`border-b-2 py-1.5 text-base font-black transition-colors ${isTypingName && sim.typedName ? "border-red-600" : "border-black"}`}>
            {sim.typedName ? <span className="text-black">{sim.typedName}</span> : <span className="text-gray-300">ANONYMOUS</span>}
            {isTypingName && sim.typedName && <span className="inline-block w-[3px] h-[18px] bg-red-600 ml-[1px]" />}
          </div>
        </div>
        {/* Message */}
        <div className="flex flex-col gap-0">
          <label className="text-[9px] font-black text-red-600 uppercase tracking-[0.2em] flex justify-between">
            <span>REACTION</span>
            <span className="text-gray-300">{sim.typedText.length}/160</span>
          </label>
          <div className={`border-b-2 py-1.5 text-sm font-bold min-h-[52px] transition-colors ${isTypingText ? "border-red-600" : "border-black"}`}>
            {sim.typedText ? <span className="text-black leading-snug">{sim.typedText}</span> : <span className="text-gray-300">SAY SOMETHING.</span>}
            {isTypingText && sim.typedText && <span className="inline-block w-[3px] h-[15px] bg-red-600 ml-[1px]" />}
          </div>
        </div>
        {/* Large emoji row */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black text-red-600 uppercase tracking-[0.2em]">FEELING</label>
          <div className="flex gap-1">
            {EMOJI_OPTIONS.map((e) => (
              <div key={e} className={`flex-1 flex items-center justify-center text-2xl py-2 border-2 transition-all duration-100 ${sim.emoji === e ? "border-red-600 bg-red-50 scale-110" : "border-black"}`}>{e}</div>
            ))}
          </div>
        </div>
        {/* CTA block */}
        <div className={`w-full h-12 flex items-center justify-center font-black text-sm uppercase tracking-widest border-2 transition-colors ${sim.phase === "done" ? "bg-red-600 text-white border-red-600" : sim.emoji ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-300 border-gray-300"}`}>
          {sim.phase === "done" ? "SENT." : sim.emoji ? `FIRE ${sim.emoji}` : "PICK A FEELING"}
        </div>
      </div>
    </ScaleWrap>
  )
}
