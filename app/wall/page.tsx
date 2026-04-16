"use client"

import { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { useParty } from "@/hooks/use-party"
import { ReactionCard } from "@/components/wall/reaction-card"
import { QuestionCard } from "@/components/wall/question-card"
import { EmojiBurst } from "@/components/wall/emoji-burst"
import { NowNextBar } from "@/components/wall/now-next-bar"

const DEMO_REACTIONS = [
  { name: "Carmen Ansio", text: "CSS animations en 2026 son una pasada 🤩", emoji: "🔥" },
  { name: "Javi Velasco", text: "El edge computing va a cambiar todo", emoji: "🤯" },
  { name: "midudev", text: "Esto es lo mejor que he visto en mucho tiempo", emoji: "👏" },
  { name: "Erick Wendel", text: "Node.js por siempre 💚", emoji: "🚀" },
  { name: "Ana García", text: "Por fin alguien habla de accesibilidad en serio", emoji: "👏" },
  { name: "Dev Anónimo", text: "¿Cuándo sale la grabación?", emoji: "😂" },
  { name: "Sunil Pai", text: "Workers + AI is the future, no doubt", emoji: "🔥" },
  { name: "Gisela Torres", text: "Los agentes de IA ya están aquí", emoji: "🤯" },
]

const DEMO_QUESTIONS = [
  { name: "Pedro López", text: "¿Cuándo crees que los agentes reemplazarán a los devs junior?" },
  { name: "María Fernández", text: "¿Qué framework recomendarías para empezar en 2026?" },
  { name: "Carlos Dev", text: "¿Cómo manejas el estado global sin Redux?" },
]

type DemoStatus = "idle" | "sending" | "done"

export default function WallPage() {
  const { state, connectionCount, isConnected, send } = useParty()
  const [appUrl, setAppUrl] = useState("")
  const [alertVisible, setAlertVisible] = useState(false)
  const [demoStatus, setDemoStatus] = useState<DemoStatus>("idle")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppUrl(window.location.origin + "/app")
    }
  }, [])

  useEffect(() => {
    if (state.alert && state.alert.expiresAt > Date.now()) {
      setAlertVisible(true)
      const timeout = setTimeout(() => {
        setAlertVisible(false)
      }, state.alert.expiresAt - Date.now())
      return () => clearTimeout(timeout)
    } else {
      setAlertVisible(false)
    }
  }, [state.alert])

  const handleDemo = async () => {
    if (demoStatus !== "idle") return
    setDemoStatus("sending")

    for (const reaction of DEMO_REACTIONS) {
      send({
        type: "reaction",
        id: crypto.randomUUID(),
        name: reaction.name,
        text: reaction.text,
        emoji: reaction.emoji,
        ts: Date.now(),
      })
      await new Promise((r) => setTimeout(r, 400))
    }

    for (const question of DEMO_QUESTIONS) {
      send({
        type: "question",
        id: crypto.randomUUID(),
        name: question.name,
        text: question.text,
        votes: 0,
        answered: false,
        ts: Date.now(),
      })
      await new Promise((r) => setTimeout(r, 600))
    }

    setDemoStatus("done")
    setTimeout(() => setDemoStatus("idle"), 2000)
  }

  const visibleReactions = state.reactions
    .filter((r) => (r.flags ?? 0) < 3)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 8)

  const topQuestions = state.questions
    .filter((q) => !q.answered)
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5)

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-b border-jsconf-border">
        <div className="flex items-center gap-4">
          <h1 className="font-display font-bold text-2xl tracking-widest uppercase">
            <span className="text-white">LIVE</span>
            <span className="text-jsconf-yellow">WALL</span>
          </h1>
          <span className="text-jsconf-border">·</span>
          <span className="font-display font-bold text-jsconf-muted uppercase tracking-wide">
            {state.mode === "wall" ? "REACTIONS" : "Q&A"}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-lg">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? "bg-green-400" : "bg-jsconf-red"}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? "bg-green-500" : "bg-jsconf-red"}`}></span>
          </span>
          <span className="text-jsconf-muted">{connectionCount}</span>
        </div>
      </header>

      {/* Current Talk */}
      {state.currentTalk && (
        <div className="flex-shrink-0 px-8 py-3 bg-jsconf-surface border-b border-jsconf-border">
          <h2 className="text-xl font-display font-semibold text-white truncate">
            {state.currentTalk}
          </h2>
        </div>
      )}

      {/* Alert Banner */}
      {alertVisible && state.alert && (
        <div className="flex-shrink-0 mx-8 mt-4 bg-jsconf-yellow text-black px-6 py-4 font-display font-bold text-xl text-center uppercase tracking-wide animate-in fade-in zoom-in duration-300">
          {state.alert.text}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-8 py-6 min-h-0">
        {state.mode === "wall" ? (
          <div className="flex flex-col gap-4">
            {visibleReactions.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-jsconf-muted font-display text-2xl uppercase tracking-wide">
                No reactions yet
              </div>
            ) : (
              visibleReactions.map((reaction, index) => (
                <ReactionCard key={reaction.id} reaction={reaction} index={index} />
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {topQuestions.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-jsconf-muted font-display text-2xl uppercase tracking-wide">
                No questions yet
              </div>
            ) : (
              topQuestions.map((question, index) => (
                <QuestionCard key={question.id} question={question} rank={index + 1} />
              ))
            )}
          </div>
        )}
      </main>

      {/* Demo Button - Hidden in production */}
      {process.env.NODE_ENV === "development" && (
        <button
          onClick={handleDemo}
          disabled={demoStatus !== "idle"}
          className="fixed bottom-32 right-6 z-50 px-4 py-2 bg-jsconf-yellow text-black font-mono text-sm font-bold shadow-lg hover:bg-jsconf-yellow/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
        >
          {demoStatus === "idle" && "🎭 Simulate reactions"}
          {demoStatus === "sending" && "⏳ Sending..."}
          {demoStatus === "done" && "✅ Done"}
        </button>
      )}

      {/* Now & Next Bar */}
      <div className="flex-shrink-0">
        <NowNextBar liveSessions={state.sessions} />
      </div>

      {/* Footer */}
      <footer className="flex-shrink-0 flex items-center gap-6 px-8 py-6 border-t border-jsconf-border bg-black/90">
        {appUrl && (
          <div className="bg-white p-3">
            <QRCodeSVG value={appUrl} size={100} />
          </div>
        )}
        <div>
          <p className="text-xl font-display font-bold text-white uppercase tracking-wide">
            Scan to participate
          </p>
          <p className="font-mono text-jsconf-muted mt-1">{appUrl}</p>
        </div>
      </footer>
    </div>
  )
}
