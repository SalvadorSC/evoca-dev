"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { QRCodeSVG } from "qrcode.react"
import { ReactTab } from "@/components/attendee/react-tab"
import { AskTab } from "@/components/attendee/ask-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AppState, ClientMessage, Reaction, Question } from "@/lib/types"

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

// ─── Demo Phone Mockup ────────────────────────────────────────────────────────
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
const EMOJIS = ["🔥", "👏", "🤯", "🚀", "😂"]

const SIM_REACTIONS: Array<{ emoji: string; text?: string; name: string }> = [
  { emoji: "🔥", name: "Alex" },
  { emoji: "👏", text: "Try me", name: "Sarah" },
  { emoji: "🤯", name: "Jordan" },
  { emoji: "🚀", text: "Evoca is truly useful for conferences", name: "Marco" },
  { emoji: "🔥", name: "Priya" },
  { emoji: "😂", name: "Tom" },
  { emoji: "👏", text: "Evoca works really well in engaging attendees", name: "Lena" },
  { emoji: "🚀", name: "Carlos" },
  { emoji: "🤯", text: "I always use Evoca to get feedback on my talks", name: "Mia" },
  { emoji: "🔥", text: "Try me", name: "David" },
]

// ─── Hero Background ──────────────────────────────────────────────────────────
// Renders floating reactions + question cards behind the hero content.
interface LiveItem {
  id: string
  kind: "reaction" | "question"
  emoji?: string
  text?: string
  name: string
  x: number   // 0–100 % of container width
  ts: number
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

  useEffect(() => {
    // Tiny delay so the CSS transition fires
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  return (
    <div
      className="absolute bottom-0 flex flex-col items-center gap-1 transition-all duration-[8000ms] ease-out"
      style={{
        left: `${item.x}%`,
        transform: visible ? "translateY(-110vh)" : "translateY(0)",
        opacity: visible ? 0 : 1,
      }}
    >
      {item.kind === "reaction" ? (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-2xl drop-shadow-lg">{item.emoji}</span>
          {item.text && (
            <span className="font-mono text-[10px] text-white/60 bg-black/40 px-2 py-0.5 rounded-full max-w-[120px] text-center leading-tight">
              {item.text}
            </span>
          )}
          <span className="font-mono text-[9px] text-white/30">{item.name}</span>
        </div>
      ) : (
        <div className="bg-black/50 border border-white/10 px-3 py-2 rounded max-w-[180px] backdrop-blur-sm">
          <p className="font-sans text-[11px] text-white/80 leading-tight mb-1">{item.text}</p>
          <p className="font-mono text-[9px] text-white/30">{item.name}</p>
        </div>
      )}
    </div>
  )
}

// ─── Interactive Phone Mockup ─────────────────────────────────────────────────
// Landing page version: local state, no PartyKit. Fires callbacks to parent
// so the hero background can be filled with activity.
export function InteractivePhoneMockup({
  onActivity,
}: {
  onActivity: (item: LiveItem) => void
}) {
  const [activeTab, setActiveTab] = useState<"react" | "ask">("react")
  const [name, setName] = useState("")
  const [reaction, setReaction] = useState("🔥")
  const [inputText, setInputText] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])

  // Idle simulation
  const lastInteractionRef = useRef<number>(Date.now())
  const simIndexRef = useRef(0)
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const markInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now()
    // Stop simulation when user interacts
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current)
      simIntervalRef.current = null
    }
  }, [])

  const fireSimReaction = useCallback(() => {
    const entry = SIM_REACTIONS[simIndexRef.current % SIM_REACTIONS.length]
    simIndexRef.current++

    const item: LiveItem = {
      id: crypto.randomUUID(),
      kind: "reaction",
      emoji: entry.emoji,
      text: entry.text,
      name: entry.name,
      x: 10 + Math.random() * 80,
      ts: Date.now(),
    }
    onActivity(item)
  }, [onActivity])

  const startSimulation = useCallback(() => {
    if (simIntervalRef.current) return
    // Fire once immediately, then every 2.5s
    fireSimReaction()
    simIntervalRef.current = setInterval(() => {
      fireSimReaction()
    }, 2500)
  }, [fireSimReaction])

  // Check for 20s idle, start simulation
  useEffect(() => {
    const idleCheck = setInterval(() => {
      const idle = Date.now() - lastInteractionRef.current
      if (idle >= 20_000 && !simIntervalRef.current) {
        startSimulation()
      }
    }, 1000)
    return () => {
      clearInterval(idleCheck)
      if (simIntervalRef.current) clearInterval(simIntervalRef.current)
    }
  }, [startSimulation])

  const handleSendReaction = () => {
    markInteraction()
    const item: LiveItem = {
      id: crypto.randomUUID(),
      kind: "reaction",
      emoji: reaction,
      text: name.trim() || undefined,
      name: name.trim() || "Anonymous",
      x: 10 + Math.random() * 80,
      ts: Date.now(),
    }
    onActivity(item)
  }

  const handleSendQuestion = () => {
    if (!inputText.trim()) return
    markInteraction()
    const q: Question = {
      type: "question",
      id: crypto.randomUUID(),
      name: name.trim() || "Anonymous",
      text: inputText.trim(),
      votes: 0,
      answered: false,
      ts: Date.now(),
    }
    setQuestions((prev) => [q, ...prev])
    const item: LiveItem = {
      id: q.id,
      kind: "question",
      text: q.text,
      name: q.name,
      x: 5 + Math.random() * 60,
      ts: Date.now(),
    }
    onActivity(item)
    setInputText("")
  }

  // Stub send for AskTab vote UI (no-op locally)
  const stubSend = useCallback((_msg: ClientMessage) => {}, [])

  return (
    <div
      className="relative"
      style={{ width: "280px" }}
      onMouseMove={markInteraction}
      onTouchStart={markInteraction}
    >
      {/* Phone shell — 3D perspective tilt */}
      <div
        className="transition-transform duration-500 hover:scale-[1.02]"
        style={{
          transform: "perspective(1000px) rotateY(-15deg) rotateX(5deg)",
        }}
      >
        <div
          className="relative border-[6px] border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden"
          style={{
            borderRadius: "40px",
            boxShadow: "0 0 0 1px #111, inset 0 0 0 1px #333",
            width: "280px",
            height: "560px",
          }}
        >
          {/* Notch */}
          <div className="absolute left-1/2 -translate-x-1/2 bg-zinc-900 z-20" style={{ top: "14px", width: "72px", height: "6px", borderRadius: "3px" }} />

          {/* Screen */}
          <div
            className="overflow-hidden bg-zinc-950 flex flex-col relative z-10"
            style={{ borderRadius: "32px", margin: "8px", height: "calc(100% - 16px)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-8 pb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white">EVOCA</span>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                </span>
                <span className="font-mono text-zinc-500" style={{ fontSize: "10px" }}>LIVE</span>
              </div>
            </div>

            {/* Name input (shared across tabs) */}
            <div className="px-4 mb-3 shrink-0">
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); markInteraction() }}
                placeholder="Your name (optional)"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 transition-colors"
              />
            </div>

            {/* Tab switcher */}
            <div className="flex border border-zinc-800 mx-4 mb-4 rounded-sm overflow-hidden shrink-0">
              <button
                onClick={() => { setActiveTab("react"); markInteraction() }}
                className={`flex-1 py-2 text-center font-mono text-xs font-bold transition-colors ${activeTab === "react" ? "bg-yellow-400 text-black" : "bg-transparent text-zinc-500 hover:text-zinc-300"}`}
              >
                React
              </button>
              <div className="bg-zinc-800" style={{ width: "1px" }} />
              <button
                onClick={() => { setActiveTab("ask"); markInteraction() }}
                className={`flex-1 py-2 text-center font-mono text-xs font-bold transition-colors ${activeTab === "ask" ? "bg-yellow-400 text-black" : "bg-transparent text-zinc-500 hover:text-zinc-300"}`}
              >
                Ask
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 px-4 flex flex-col min-h-0">
              {activeTab === "react" ? (
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                  <div className="grid grid-cols-5 gap-2 mb-4 shrink-0">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => { setReaction(emoji); markInteraction() }}
                        className={`aspect-square flex items-center justify-center text-lg border rounded-lg transition-all ${
                          reaction === emoji
                            ? "border-yellow-400 bg-yellow-400/10 scale-110"
                            : "border-zinc-800 bg-transparent hover:border-zinc-600"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div className="mt-auto mb-6 shrink-0">
                    <button
                      onClick={handleSendReaction}
                      className="w-full py-3.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wide bg-yellow-400 text-black hover:bg-yellow-500 transition-transform active:scale-95"
                    >
                      Send {reaction}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full animate-in fade-in duration-300 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <div className="mb-3 shrink-0">
                    <textarea
                      placeholder="Ask the speaker a question..."
                      value={inputText}
                      onChange={(e) => { setInputText(e.target.value); markInteraction() }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-3 font-mono text-xs text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-yellow-400 transition-colors h-20"
                    />
                  </div>
                  <div className="mb-4 shrink-0">
                    <button
                      onClick={handleSendQuestion}
                      disabled={!inputText.trim()}
                      className={`w-full py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wide transition-all active:scale-95 ${
                        inputText.trim() ? "bg-yellow-400 text-black hover:bg-yellow-500" : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                      }`}
                    >
                      Submit Question
                    </button>
                  </div>
                  {/* Local questions list */}
                  {questions.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {questions.map((q) => (
                        <div key={q.id} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
                          <p className="font-sans text-[11px] text-white leading-tight mb-1">{q.text}</p>
                          <p className="font-mono text-[9px] text-zinc-500">{q.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Home bar */}
            <div className="absolute left-1/2 -translate-x-1/2 bg-zinc-700" style={{ bottom: "10px", width: "80px", height: "4px", borderRadius: "2px" }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Export LiveItem type for parent use
export type { LiveItem }
