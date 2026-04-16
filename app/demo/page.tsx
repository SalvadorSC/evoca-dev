"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import PartySocket from "partysocket"
import { QRCodeSVG } from "qrcode.react"
import { ReactionCard } from "@/components/wall/reaction-card"
import { QuestionCard } from "@/components/wall/question-card"
import { EmojiBurst } from "@/components/wall/emoji-burst"
import { ReactTab } from "@/components/attendee/react-tab"
import { AskTab } from "@/components/attendee/ask-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AppState, ClientMessage, ServerMessage } from "@/lib/types"

const PARTY_HOST = "jsconf-live-wall.salvadorsc.partykit.dev"

const DEMO_TALK = {
  title: "The Future of Web Performance",
  speaker: "Alex Rivera",
  conference: "DevSummit 2026",
  role: "Senior Engineer @ Vercel"
}

const initialState: AppState = {
  reactions: [],
  questions: [],
  currentTalk: DEMO_TALK.title,
  mode: "wall",
  alert: null,
  sessions: [],
  attendance: {},
}

const DEMO_REACTIONS = [
  { name: "Jamie Chen", text: "This is exactly what I needed to hear today", emoji: "🔥" },
  { name: "Morgan Lee", text: "Mind blown — didn't know this was possible", emoji: "🤯" },
  { name: "Sam Rivera", text: "Taking notes like crazy right now", emoji: "👏" },
  { name: "Alex Kim", text: "When does the recording come out?", emoji: "😂" },
  { name: "Taylor Brooks", text: "We need to implement this at work ASAP", emoji: "🚀" },
  { name: "Jordan Park", text: "Best talk of the conference so far", emoji: "🔥" },
  { name: "Casey Morgan", text: "I have so many questions for Q&A", emoji: "🤯" },
  { name: "Riley Walsh", text: "This changes everything about how I think about it", emoji: "👏" },
]

const DEMO_QUESTIONS = [
  { name: "Jamie Chen", text: "How does this scale to millions of users?" },
  { name: "Morgan Lee", text: "What's the biggest mistake teams make when adopting this?" },
  { name: "Sam Rivera", text: "Is there an open source version available?" },
  { name: "Alex Kim", text: "How long did it take your team to implement this?" },
]

// Generate or retrieve session ID for isolation
function getSessionId(): string {
  if (typeof window === "undefined") return crypto.randomUUID()
  const params = new URLSearchParams(window.location.search)
  let sessionId = params.get("session")
  if (!sessionId) {
    sessionId = crypto.randomUUID()
  }
  return sessionId
}

// Hook for demo PartyKit connection with session isolation
function useDemoParty(sessionId: string) {
  const roomName = `demo-${sessionId}`
  const [state, setState] = useState<AppState>(initialState)
  const [connectionCount, setConnectionCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<PartySocket | null>(null)
  const seededRef = useRef(false)
  const reactionCountRef = useRef(0)
  const questionCountRef = useRef(0)
  const autoReactionRef = useRef<ReturnType<typeof setInterval>>()
  const autoQuestionRef = useRef<ReturnType<typeof setInterval>>()

  const send = useCallback((message: ClientMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message))
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const socket = new PartySocket({ host: PARTY_HOST, room: roomName })
    socketRef.current = socket

    socket.addEventListener("open", () => setIsConnected(true))
    socket.addEventListener("close", () => setIsConnected(false))
    socket.addEventListener("message", (event) => {
      const data = event.data
      if (typeof data !== "string") return
      const trimmed = data.trim()
      if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return
      let message: ServerMessage
      try { message = JSON.parse(trimmed) } catch { return }
      if (message.type === "sync") setState(message.state)
      else if (message.type === "connections") setConnectionCount(message.count)
    })

    return () => socket.close()
  }, [roomName])

  // Seed initial content after 2s delay, staggered 600ms apart
  useEffect(() => {
    if (!isConnected || seededRef.current) return
    seededRef.current = true

    // Set the talk title
    send({ type: "set_talk", title: DEMO_TALK.title } as ClientMessage)

    const seedDelay = setTimeout(() => {
      // Seed 4 reactions
      DEMO_REACTIONS.slice(0, 4).forEach((r, i) => {
        setTimeout(() => {
          send({ type: "reaction", id: crypto.randomUUID(), name: r.name, text: r.text, emoji: r.emoji, ts: Date.now() - (4 - i) * 15000 })
          reactionCountRef.current++
        }, i * 1000)
      })
      // Seed 2 questions
      DEMO_QUESTIONS.slice(0, 2).forEach((q, i) => {
        setTimeout(() => {
          send({ type: "question", id: crypto.randomUUID(), name: q.name, text: q.text, votes: Math.floor(Math.random() * 8) + 3, answered: false, ts: Date.now() - (2 - i) * 25000 })
          questionCountRef.current++
        }, 2400 + i * 600)
      })
    }, 2000)

    return () => clearTimeout(seedDelay)
  }, [isConnected, send])

  // Auto-add reactions: every 15s until 7, then every 60s
  useEffect(() => {
    if (!isConnected) return

    const scheduleNextReaction = () => {
      const delay = reactionCountRef.current >= 7 ? 60000 : 15000
      autoReactionRef.current = setTimeout(() => {
        const r = DEMO_REACTIONS[Math.floor(Math.random() * DEMO_REACTIONS.length)]
        send({ type: "reaction", id: crypto.randomUUID(), name: r.name, text: r.text, emoji: r.emoji, ts: Date.now() })
        reactionCountRef.current++
        scheduleNextReaction()
      }, delay)
    }

    scheduleNextReaction()
    return () => clearTimeout(autoReactionRef.current)
  }, [isConnected, send])

  // Auto-add questions: every 35s until 5, then every 60s
  useEffect(() => {
    if (!isConnected) return

    const scheduleNextQuestion = () => {
      const delay = questionCountRef.current >= 5 ? 60000 : 35000
      autoQuestionRef.current = setTimeout(() => {
        const q = DEMO_QUESTIONS[Math.floor(Math.random() * DEMO_QUESTIONS.length)]
        send({ type: "question", id: crypto.randomUUID(), name: q.name, text: q.text, votes: 1, answered: false, ts: Date.now() })
        questionCountRef.current++
        scheduleNextQuestion()
      }, delay)
    }

    scheduleNextQuestion()
    return () => clearTimeout(autoQuestionRef.current)
  }, [isConnected, send])

  // Cap visible: 8 reactions and 5 questions
  const visibleReactions = state.reactions
    .filter((r) => (r.flags ?? 0) < 3)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 8)

  const visibleQuestions = state.questions
    .filter((q) => !q.answered)
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5)

  return { state, connectionCount, isConnected, send, visibleReactions, visibleQuestions, roomName }
}

// Attendee-only view (for ?attendee=true)
function AttendeeView({ sessionId }: { sessionId: string }) {
  const { state, isConnected, connectionCount, send } = useDemoParty(sessionId)

  return (
    <div className="min-h-screen bg-jsconf-bg text-white flex flex-col">
      <header className="border-b border-jsconf-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-base tracking-wide">
            <span className="text-white">Evo</span>
            <span className="text-jsconf-yellow">ca</span>
          </span>
          <span className="text-jsconf-muted font-mono text-xs">· {DEMO_TALK.conference}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-400" : "bg-jsconf-muted"}`} />
          <span className="font-mono text-xs text-jsconf-muted">{connectionCount} online</span>
        </div>
      </header>

      <div className="flex-1 px-4 py-5">
        <Tabs defaultValue="react" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-jsconf-surface border border-jsconf-border rounded-none h-auto p-0 mb-5">
            <TabsTrigger value="react" className="rounded-none data-[state=active]:bg-jsconf-yellow data-[state=active]:text-black font-display font-bold uppercase tracking-wide py-3 text-sm">
              React
            </TabsTrigger>
            <TabsTrigger value="ask" className="rounded-none data-[state=active]:bg-jsconf-yellow data-[state=active]:text-black font-display font-bold uppercase tracking-wide py-3 text-sm">
              Ask
            </TabsTrigger>
          </TabsList>
          <TabsContent value="react" className="mt-0">
            <ReactTab send={send} />
          </TabsContent>
          <TabsContent value="ask" className="mt-0">
            <AskTab send={send} questions={state.questions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Phone mockup component - fixed size with scrollable content
function PhoneMockup({ send, questions, qrUrl }: { send: (m: ClientMessage) => void; questions: AppState["questions"]; qrUrl: string }) {
  return (
    <div className="flex items-start gap-6">
      {/* Phone frame - fixed dimensions */}
      <div className="flex flex-col items-center gap-3 shrink-0">
        <p className="font-mono text-xs text-jsconf-muted uppercase tracking-widest">Attendee View</p>
        <div className="relative w-[260px] h-[520px] rounded-[2.5rem] border-4 border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
          {/* Top notch */}
          <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[72px] h-[20px] bg-black rounded-full z-10" />

          {/* Screen */}
          <div className="h-full flex flex-col rounded-[2rem] bg-jsconf-bg overflow-hidden p-2">
            {/* Status bar inside phone */}
            <div className="shrink-0 bg-jsconf-bg flex items-center justify-between px-5 pt-6 pb-1 z-10">
              {/* <span className="font-mono text-[10px] text-jsconf-muted">Live Wall</span>
              <span className="font-mono text-[10px] text-jsconf-yellow">DEMO</span> */}
            </div>

            {/* Scaled attendee UI — React tab fixed, Ask tab scrollable */}
            <Tabs defaultValue="react" className="flex-1 flex flex-col min-h-0 px-1">
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
              {/* React tab: no scroll */}
              <TabsContent value="react" className="mt-0 flex-1 min-h-0">
                <div style={{ transform: "scale(0.82)", transformOrigin: "top center", width: "122%", marginLeft: "-11%" }} className="pb-4">
                  <ReactTab send={send} />
                </div>
              </TabsContent>
              {/* Ask tab: scrollable */}
              <TabsContent value="ask" className="mt-0 flex-1 min-h-0 overflow-y-auto">
                <div style={{ transform: "scale(0.82)", transformOrigin: "top center", width: "122%", marginLeft: "-11%" }} className="pb-8">
                  <AskTab send={send} questions={questions} />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Home bar */}
          <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 w-[80px] h-[4px] bg-white/30 rounded-full" />
        </div>
      </div>

      {/* QR Code - to the right of phone */}
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

// Full demo view
function FullDemoView({ sessionId }: { sessionId: string }) {
  const { state, connectionCount, isConnected, send, visibleReactions, visibleQuestions } = useDemoParty(sessionId)
  const [wallTab, setWallTab] = useState<"wall" | "qa">("wall")
  const [qrUrl, setQrUrl] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const base = window.location.origin + "/demo"
      setQrUrl(`${base}?session=${sessionId}&attendee=true`)
    }
  }, [sessionId])

  return (
    <div className="h-screen bg-jsconf-bg text-white flex flex-col overflow-hidden">
      {/* Slim live banner */}
      {/* <div className="bg-jsconf-yellow text-black px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-40" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-black" />
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-widest">Live Demo</span>
          </span>
          <span className="font-sans text-xs font-medium hidden sm:inline">
            Post a reaction and watch it appear on the wall in real time. No sign-up needed.
          </span>
        </div>
        <Link href="/login" className="font-mono text-xs font-bold bg-black text-jsconf-yellow px-3 py-1.5 hover:bg-zinc-900 transition-colors">
          Start for free
        </Link>
      </div> */}

      {/* Wall header */}
      <header className="border-b border-jsconf-border px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex justify-between gap-3 w-[100%]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg tracking-wide">
                <span className="text-white">Evo</span>
                <span className="text-jsconf-yellow">ca</span>
              </span>
              <span className="text-jsconf-muted">·</span>
              <span className="text-jsconf-muted font-mono text-xs">{DEMO_TALK.conference}</span>
              <span className="font-mono text-xs font-bold text-jsconf-yellow border border-jsconf-yellow px-2 py-0.5 uppercase tracking-widest ml-2">
                Demo
              </span>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? "bg-green-400" : "bg-jsconf-muted"}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-green-400" : "bg-jsconf-muted"}`} />
              </span>
              <span className="font-mono text-xs text-jsconf-muted">{connectionCount} online</span>
            </div>
          </div>
          <div className="bg-jsconf-yellow text-black px-4 py-2 flex items-center justify-between gap-3 flex-wrap h-[100%]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red opacity-40" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-black" />
                </span>
                <span className="font-mono text-xs font-bold uppercase tracking-widest">Live Demo</span>
              </span>
              <span className="font-sans text-xs font-medium hidden sm:inline">
                Post a reaction and watch it appear on the wall in real time. No sign-up needed.
              </span>
            </div>
            <Link href="/login" className="font-mono text-xs font-bold bg-black text-jsconf-yellow px-3 py-1.5 hover:bg-zinc-900 transition-colors">
              Start for free
            </Link>
          </div>
        </div>


      </header>

      {/* Two-column layout — flex-1 min-h-0 ensures inner panels scroll, not the page */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left: Live Wall feed */}
        <div className="flex-1 lg:flex-[65] border-b lg:border-b-0 lg:border-r border-jsconf-border flex flex-col min-h-0 overflow-hidden">
          {/* Tab switcher */}
          <div className="px-6 py-3 border-b border-jsconf-border shrink-0">
            <div className="flex gap-0 w-fit border border-jsconf-border">
              <button
                onClick={() => setWallTab("wall")}
                className={`font-display font-bold text-xs uppercase tracking-widest px-5 py-2.5 transition-colors ${wallTab === "wall" ? "bg-jsconf-yellow text-black" : "bg-transparent text-jsconf-muted hover:text-white"}`}
              >
                Reactions
              </button>
              <button
                onClick={() => setWallTab("qa")}
                className={`font-display font-bold text-xs uppercase tracking-widest px-5 py-2.5 transition-colors border-l border-jsconf-border ${wallTab === "qa" ? "bg-jsconf-yellow text-black" : "bg-transparent text-jsconf-muted hover:text-white"}`}
              >
                Q&amp;A
              </button>
            </div>
          </div>

          {/* Scrollable feed area */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3 min-h-0">
            {wallTab === "wall" ? (
              visibleReactions.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-jsconf-muted font-mono text-sm uppercase tracking-wide">
                  Loading reactions...
                </div>
              ) : (
                visibleReactions.map((reaction, index) => (
                  <ReactionCard key={reaction.id} reaction={reaction} index={index} />
                ))
              )
            ) : (
              visibleQuestions.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-jsconf-muted font-mono text-sm uppercase tracking-wide">
                  No questions yet...
                </div>
              ) : (
                visibleQuestions.map((question, index) => (
                  <QuestionCard key={question.id} question={question} rank={index + 1} />
                ))
              )
            )}
          </div>
        </div>

        {/* Right: Phone mockup - fixed width, doesn't grow */}
        <div className="lg:flex-[35] bg-jsconf-surface flex items-start justify-center px-6 py-8 shrink-0 overflow-y-auto">
          <PhoneMockup send={send} questions={state.questions} qrUrl={qrUrl} />
        </div>
      </div>

      {/* Bottom CTA cards */}
      <div className="border-t border-jsconf-border px-6 py-6 bg-jsconf-bg shrink-0">
        <p className="text-center font-display font-bold text-white text-lg mb-4">Want this for your talk?</p>
        <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/?role=speaker" className="group block">
            <div className="h-full border-l-4 border-jsconf-yellow bg-jsconf-surface border border-l-jsconf-yellow border-t-jsconf-border border-r-jsconf-border border-b-jsconf-border p-5 flex flex-col gap-2 hover:bg-jsconf-surface-2 transition-colors">
              <span className="font-display font-bold text-white text-base uppercase tracking-wide">I&apos;m a speaker</span>
              <p className="font-sans text-sm text-jsconf-muted leading-relaxed">
                Set up your talk in 2 minutes. Free forever.
              </p>
              <span className="font-mono text-xs text-jsconf-yellow mt-auto group-hover:underline">Get started</span>
            </div>
          </Link>
          <Link href="/?role=organizer" className="group block">
            <div className="h-full border-l-4 border-[#00E887] bg-jsconf-surface border border-l-[#00E887] border-t-jsconf-border border-r-jsconf-border border-b-jsconf-border p-5 flex flex-col gap-2 hover:bg-jsconf-surface-2 transition-colors">
              <span className="font-display font-bold text-white text-base uppercase tracking-wide">I&apos;m organizing a conference</span>
              <p className="font-sans text-sm text-jsconf-muted leading-relaxed">
                Bring Live Wall to your event.
              </p>
              <span className="font-mono text-xs text-[#00E887] mt-auto group-hover:underline">Learn more</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

// Route wrapper
function DemoContent() {
  const searchParams = useSearchParams()
  const [sessionId, setSessionId] = useState<string>("")

  useEffect(() => {
    setSessionId(getSessionId())
  }, [])

  const isAttendeeMode = searchParams.get("attendee") === "true"

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-jsconf-bg flex items-center justify-center">
        <span className="font-mono text-jsconf-muted text-sm uppercase tracking-widest">Loading...</span>
      </div>
    )
  }

  if (isAttendeeMode) return <AttendeeView sessionId={sessionId} />
  return <FullDemoView sessionId={sessionId} />
}

export default function DemoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-jsconf-bg flex items-center justify-center">
        <span className="font-mono text-jsconf-muted text-sm uppercase tracking-widest">Loading...</span>
      </div>
    }>
      <DemoContent />
    </Suspense>
  )
}
