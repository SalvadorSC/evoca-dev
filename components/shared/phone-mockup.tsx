"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { QRCodeSVG } from "qrcode.react"
import { ReactTab } from "@/components/attendee/react-tab"
import { AskTab } from "@/components/attendee/ask-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AppState, ClientMessage, Question } from "@/lib/types"

// ─── Phone Frame ──────────────────────────────────────────────────────────────
export function PhoneFrame({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`relative w-[260px] h-[520px] rounded-[2.5rem] border-4 border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden ${className}`}
      style={style}
    >
      <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[72px] h-[20px] bg-black rounded-full z-10" />
      <div className="h-full flex flex-col rounded-[2rem] bg-jsconf-bg overflow-hidden p-2">
        {children}
      </div>
      <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 w-[80px] h-[4px] bg-white/30 rounded-full z-10" />
    </div>
  )
}

// ─── Demo Phone Mockup (used by /demo, connected to PartyKit) ─────────────────
export function DemoPhoneMockup({
  send,
  questions,
  qrUrl,
  activeTab,
  onTabChange,
}: {
  send: (m: ClientMessage) => void
  questions: AppState["questions"]
  qrUrl: string
  activeTab: "wall" | "qa"
  onTabChange: (tab: "wall" | "qa") => void
}) {
  const phoneTab = activeTab === "wall" ? "react" : "ask"

  return (
    <div className="flex items-start gap-6">
      <div className="flex flex-col items-center gap-3 shrink-0">
        <p className="font-mono text-xs text-jsconf-muted uppercase tracking-widest">Attendee View</p>
        <PhoneFrame>
          <div className="shrink-0 bg-jsconf-bg flex items-center justify-between px-5 pt-6 pb-1 z-10" />
          <Tabs
            value={phoneTab}
            onValueChange={(v) => onTabChange(v === "react" ? "wall" : "qa")}
            className="flex-1 flex flex-col min-h-0 px-1"
          >
            <div style={{ transform: "scale(0.82)", transformOrigin: "top center", width: "122%", marginLeft: "-11%" }} className="shrink-0">
              <TabsList className="grid w-full grid-cols-2 bg-jsconf-surface border border-jsconf-border rounded-none h-auto p-0 mb-0">
                <TabsTrigger value="react" className="rounded-none data-[state=active]:bg-jsconf-yellow data-[state=active]:text-black font-display font-bold uppercase tracking-wide py-2.5 text-xs">
                  React
                </TabsTrigger>
                <TabsTrigger value="ask" className="rounded-none data-[state=active]:bg-jsconf-yellow data-[state=active]:text-black font-display font-bold uppercase tracking-wide py-2.5 text-xs">
                  Ask
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="react" className="mt-0 flex-1 min-h-0">
              <div style={{ transform: "scale(0.82)", transformOrigin: "top center", width: "122%", marginLeft: "-11%" }} className="pb-4">
                <ReactTab send={send} />
              </div>
            </TabsContent>
            <TabsContent value="ask" className="mt-0 flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div style={{ transform: "scale(0.82)", transformOrigin: "top center", width: "122%", marginLeft: "-11%" }} className="pb-8">
                <AskTab send={send} questions={questions} />
              </div>
            </TabsContent>
          </Tabs>
        </PhoneFrame>
      </div>
      {qrUrl && (
        <div className="flex flex-col items-center gap-2 pt-8">
          <div className="bg-white p-2 rounded">
            <QRCodeSVG value={qrUrl} size={72} />
          </div>
          <p className="font-mono text-[10px] text-jsconf-muted leading-relaxed text-center max-w-[80px]">
            Scan to try on your phone
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Simulation data ──────────────────────────────────────────────────────────
const EMOJIS = ["🔥", "👏", "🤯", "🚀", "😂", "💀"]

const SIM_SCRIPTS: Array<{ tab: "react" | "ask"; emoji?: string; name: string; text: string }> = [
  { tab: "react", emoji: "🔥", name: "Alex", text: "" },
  { tab: "react", emoji: "👏", name: "Sarah", text: "Try me" },
  { tab: "react", emoji: "🤯", name: "Jordan", text: "Evoca is truly useful for conferences" },
  { tab: "react", emoji: "🚀", name: "Marco", text: "" },
  { tab: "react", emoji: "🔥", name: "Priya", text: "Evoca works really well in engaging attendees" },
  { tab: "react", emoji: "😂", name: "Tom", text: "" },
  { tab: "react", emoji: "👏", name: "Lena", text: "I always use Evoca to get feedback on my talks" },
  { tab: "react", emoji: "🚀", name: "Carlos", text: "" },
  { tab: "react", emoji: "💀", name: "Mia", text: "Try me, try Evoca!" },
]

// ─── Hero Background ──────────────────────────────────────────────────────────
export interface LiveItem {
  id: string
  kind: "reaction" | "question"
  emoji?: string
  text?: string
  name: string
  /** 0–100 % vertical start position within container */
  y: number
  /** Direction: true = left→right, false = right→left */
  ltr: boolean
  ts: number
  /** If true the item loops indefinitely (user-submitted). Sim items play once. */
  persistent?: boolean
}

export function HeroBackground({ items }: { items: LiveItem[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {items.map((item) => (
        <FloatingItem key={item.id} item={item} />
      ))}
    </div>
  )
}

function FloatingItem({ item }: { item: LiveItem }) {
  const [visible, setVisible] = useState(false)
  const animName = `hero-float-${item.ltr ? "ltr" : "rtl"}`
  // Random delay so simultaneous items don't overlap perfectly
  const delay = `${(item.ts % 1000) / 1000}s`

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div
      className="absolute flex items-center gap-2 transition-none"
      style={{
        top: `${item.y}%`,
        left: 0,
        right: 0,
        animation: visible ? `${animName} 18s linear ${item.persistent ? "infinite" : "forwards"}` : undefined,
        animationDelay: delay,
        opacity: visible ? undefined : 0,
      }}
    >
      <style>{`
        @keyframes hero-float-ltr {
          0%   { transform: translateX(-240px); opacity: 0; }
          6%   { opacity: 1; }
          88%  { opacity: 1; }
          100% { transform: translateX(calc(100vw + 240px)); opacity: 0; }
        }
        @keyframes hero-float-rtl {
          0%   { transform: translateX(calc(100vw + 240px)); opacity: 0; }
          6%   { opacity: 1; }
          88%  { opacity: 1; }
          100% { transform: translateX(-240px); opacity: 0; }
        }
      `}</style>

      {item.kind === "reaction" ? (
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full shrink-0">
          <span className="text-3xl leading-none">{item.emoji}</span>
          {item.text && (
            <span className="font-sans text-sm text-white/80 whitespace-nowrap">{item.text}</span>
          )}
          <span className="font-mono text-xs text-white/40 whitespace-nowrap">{item.name}</span>
        </div>
      ) : (
        <div className="bg-black/50 border border-white/10 px-4 py-2.5 rounded-xl backdrop-blur-sm shrink-0 max-w-[280px]">
          <p className="font-sans text-sm text-white/80 leading-snug mb-1">{item.text}</p>
          <p className="font-mono text-xs text-white/40">{item.name}</p>
        </div>
      )}
    </div>
  )
}

// ─── Interactive Phone Mockup (landing page) ──────────────────────────────────
// Uses the exact same PhoneFrame + ReactTab/AskTab as DemoPhoneMockup.
// During simulation, an overlay animates the fields before firing send().

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

export function InteractivePhoneMockup({
  onActivity,
}: {
  onActivity: (item: LiveItem) => void
}) {
  // Sim overlay state — shown on top of the real tabs during automation
  const [sim, setSim] = useState<SimState | null>(null)
  const [activeTab, setActiveTab] = useState<"wall" | "qa">("wall")
  const phoneTab = activeTab === "wall" ? "react" : "ask"

  const lastInteractionRef = useRef<number>(Date.now())
  const simRunningRef = useRef(false)
  const simIndexRef = useRef(0)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const markInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now()
    simRunningRef.current = false
    setSim(null)
    // Reset the idle timer
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => { runNextSim() }, 20_000)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Typewriter helper — calls setSim progressively
  function typewrite(
    field: "typedName" | "typedText",
    fullText: string,
    intervalMs: number,
    onDone: () => void
  ) {
    let i = 0
    const t = setInterval(() => {
      if (!simRunningRef.current) { clearInterval(t); return }
      i++
      setSim((prev) => prev ? { ...prev, [field]: fullText.slice(0, i) } : prev)
      if (i >= fullText.length) { clearInterval(t); onDone() }
    }, intervalMs)
  }

  const runNextSim = useCallback(() => {
    if (!simRunningRef.current) simRunningRef.current = true

    const script = SIM_SCRIPTS[simIndexRef.current % SIM_SCRIPTS.length]
    simIndexRef.current++

    const emoji = script.emoji ?? EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
    const hasText = script.text.length > 0

    // Switch to correct tab
    setActiveTab(script.tab === "react" ? "wall" : "qa")

    const base: SimState = {
      active: true,
      tab: script.tab,
      name: script.name,
      typedName: "",
      text: script.text,
      typedText: "",
      emoji: null,
      phase: "typing-name",
    }
    setSim(base)

    // Phase 1: type name
    typewrite("typedName", script.name, 60, () => {
      if (!simRunningRef.current) return
      setSim((p) => p ? { ...p, phase: hasText ? "typing-text" : "picking-emoji" } : p)

      if (hasText) {
        // Phase 2: type text
        setTimeout(() => {
          typewrite("typedText", script.text, 45, () => {
            if (!simRunningRef.current) return
            setSim((p) => p ? { ...p, phase: "picking-emoji" } : p)
            pickEmojiThenSend(emoji, script)
          })
        }, 300)
      } else {
        pickEmojiThenSend(emoji, script)
      }
    })
  }, [onActivity]) // eslint-disable-line react-hooks/exhaustive-deps

  function pickEmojiThenSend(emoji: string, script: (typeof SIM_SCRIPTS)[number]) {
    if (!simRunningRef.current) return
    setTimeout(() => {
      setSim((p) => p ? { ...p, emoji, phase: "sending" } : p)
      setTimeout(() => {
        if (!simRunningRef.current) return

        const item: LiveItem = {
          id: crypto.randomUUID(),
          kind: "reaction",
          emoji,
          text: script.text || undefined,
          name: script.name,
          y: 15 + Math.random() * 65,
          ltr: Math.random() > 0.5,
          ts: Date.now(),
        }
        onActivity(item)

        setSim((p) => p ? { ...p, phase: "done" } : p)

        // Pause then run next
        setTimeout(() => {
          if (!simRunningRef.current) return
          setSim(null)
          setTimeout(() => { if (simRunningRef.current) runNextSim() }, 800)
        }, 1200)
      }, 500)
    }, 400)
  }

  // Start idle timer on mount
  useEffect(() => {
    idleTimerRef.current = setTimeout(() => {
      simRunningRef.current = true
      runNextSim()
    }, 20_000)
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      simRunningRef.current = false
    }
  }, [runNextSim])

  // Stub send for the real tabs (no PartyKit — user actions only update local display)
  const stubSend = useCallback((_msg: ClientMessage) => {
    markInteraction()
    if (_msg.type === "reaction" || _msg.type === "question") {
      const item: LiveItem = {
        id: _msg.id ?? crypto.randomUUID(),
        kind: _msg.type === "reaction" ? "reaction" : "question",
        emoji: _msg.type === "reaction" ? _msg.emoji : undefined,
        text: _msg.type === "reaction" ? (_msg.text || undefined) : _msg.text,
        name: _msg.name || "Anonymous",
        y: 15 + Math.random() * 65,
        ltr: Math.random() > 0.5,
        ts: Date.now(),
        persistent: true,
      }
      onActivity(item)
    }
  }, [markInteraction, onActivity])

  return (
    <div
      className="relative"
      onMouseMove={markInteraction}
      onTouchStart={markInteraction}
      style={{ width: "260px" }}
    >
      {/* 3D tilt wrapper */}
      <div
        className="transition-transform duration-500 hover:scale-[1.02]"
        style={{ transform: "perspective(1000px) rotateY(-12deg) rotateX(4deg)" }}
      >
        <PhoneFrame>
          {/* Status bar */}
          <div className="shrink-0 bg-jsconf-bg flex items-center justify-between px-5 pt-6 pb-1 z-10" />

          {/* Tabs — same structure as DemoPhoneMockup */}
          <Tabs
            value={phoneTab}
            onValueChange={(v) => { setActiveTab(v === "react" ? "wall" : "qa"); markInteraction() }}
            className="flex-1 flex flex-col min-h-0 px-1 relative"
          >
            <div
              style={{ transform: "scale(0.82)", transformOrigin: "top center", width: "122%", marginLeft: "-11%" }}
              className="shrink-0"
            >
              <TabsList className="grid w-full grid-cols-2 bg-jsconf-surface border border-jsconf-border rounded-none h-auto p-0 mb-0">
                <TabsTrigger value="react" className="rounded-none data-[state=active]:bg-jsconf-yellow data-[state=active]:text-black font-display font-bold uppercase tracking-wide py-2.5 text-xs">
                  React
                </TabsTrigger>
                <TabsTrigger value="ask" className="rounded-none data-[state=active]:bg-jsconf-yellow data-[state=active]:text-black font-display font-bold uppercase tracking-wide py-2.5 text-xs">
                  Ask
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="react" className="mt-0 flex-1 min-h-0 relative">
              <div style={{ transform: "scale(0.82)", transformOrigin: "top center", width: "122%", marginLeft: "-11%" }} className="pb-4">
                <ReactTab send={stubSend} />
              </div>

              {/* Sim overlay for React tab */}
              {sim?.active && sim.tab === "react" && (
                <SimOverlayReact sim={sim} />
              )}
            </TabsContent>

            <TabsContent value="ask" className="mt-0 flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative">
              <div style={{ transform: "scale(0.82)", transformOrigin: "top center", width: "122%", marginLeft: "-11%" }} className="pb-8">
                <AskTab send={stubSend} questions={[]} />
              </div>
            </TabsContent>
          </Tabs>
        </PhoneFrame>
      </div>
    </div>
  )
}

// ─── Sim Overlay — React Tab ──────────────────────────────────────────────────
// Covers the real ReactTab during simulation. Always renders ALL fields to match
// the real layout — text field is always shown (empty when script has no text).
const EMOJI_OPTIONS = ["🔥", "🤯", "😂", "💀", "👏", "🚀"]

function SimOverlayReact({ sim }: { sim: SimState }) {
  const isTypingName = sim.phase === "typing-name"
  const isTypingText = sim.phase === "typing-text"
  const isPicking = sim.phase === "picking-emoji"
  const isSending = sim.phase === "sending" || sim.phase === "done"

  return (
    <div
      className="absolute inset-0 bg-jsconf-bg pointer-events-none"
      style={{ transform: "scale(0.82)", transformOrigin: "top center", width: "122%", marginLeft: "-11%" }}
    >
      <div className="flex flex-col gap-5 pt-1 pb-4">

        {/* Name field */}
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs text-jsconf-muted uppercase tracking-wide">
            Your Name <span className="normal-case">(optional)</span>
          </label>
          <div className={`bg-jsconf-surface border h-11 flex items-center px-3 font-sans text-white text-sm ${isTypingName ? "border-jsconf-yellow" : "border-jsconf-border"}`}>
            <span>{sim.typedName}</span>
            {isTypingName && <span className="inline-block w-[2px] h-[14px] bg-jsconf-yellow ml-[1px] animate-pulse" />}
          </div>
        </div>

        {/* Reaction text field — always shown */}
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs text-jsconf-muted uppercase tracking-wide flex items-center justify-between">
            <span>Your Reaction <span className="normal-case font-sans font-normal">(optional)</span></span>
            <span className="font-mono text-xs text-jsconf-muted">{sim.typedText.length}/160</span>
          </label>
          <div className={`bg-jsconf-surface border px-3 py-2 font-sans text-white text-sm min-h-[72px] ${isTypingText ? "border-jsconf-yellow" : "border-jsconf-border"}`}>
            <span>{sim.typedText}</span>
            {isTypingText && <span className="inline-block w-[2px] h-[14px] bg-jsconf-yellow ml-[1px] animate-pulse" />}
          </div>
        </div>

        {/* Emoji picker */}
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs text-jsconf-muted uppercase tracking-wide">
            How are you feeling?
          </label>
          <div className={`flex gap-2 flex-wrap p-2 border transition-colors ${isPicking || isSending ? "border-transparent" : "border-transparent"}`}>
            {EMOJI_OPTIONS.map((emoji) => (
              <div
                key={emoji}
                className={`text-3xl p-3 border transition-all duration-150 bg-jsconf-yellow ${sim.emoji === emoji
                  ? "bg-jsconf-yellow-dim border-jsconf-yellow scale-110"
                  : "bg-jsconf-surface border-jsconf-border"
                  }`}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Send button — yellow once an emoji is selected, matching real ReactTab */}
        <div
          className={`w-full h-12 flex items-center justify-center font-display font-bold uppercase tracking-wide text-sm bg-jsconf-yellow transition-colors ${sim.emoji ? "text-black" : "border border-jsconf-border text-jsconf-muted"
            }`}
        >
          {sim.phase === "done" ? "Sent!" : sim.emoji ? `Send ${sim.emoji}` : "Send Reaction"}
        </div>

      </div>
    </div>
  )
}

// Export LiveItem type for parent use
export type { }
