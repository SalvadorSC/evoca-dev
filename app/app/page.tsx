"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReactTab } from "@/components/attendee/react-tab"
import { AskTab } from "@/components/attendee/ask-tab"
import { ScheduleTab } from "@/components/attendee/schedule-tab"
import { FeedbackScreen } from "@/components/attendee/feedback-screen"
import { Header } from "@/components/shared/header"
import { useParty } from "@/hooks/use-party"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { Zap, MessageCircleQuestion, Calendar, Share2, X } from "lucide-react"

function LiveBanner() {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEYS.bannerDismissed)
    if (!dismissed) setVisible(true)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEYS.bannerDismissed, "true")
    setVisible(false)
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: "EVOCA — Live Wall", url })
      } catch { }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!visible) return null

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-jsconf-yellow-dim border-b border-jsconf-yellow text-white text-sm font-sans">
      {/* LIVE dot */}
      <span className="flex items-center gap-1.5 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-jsconf-red opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-jsconf-red"></span>
        </span>
        <span className="font-mono text-xs font-bold text-jsconf-yellow uppercase tracking-widest">LIVE</span>
      </span>

      {/* Message */}
      <p className="flex-1 text-jsconf-muted text-xs">
        <span className="text-white font-medium">This is live.</span> Share it and see reactions and questions from others in real time.
      </p>

      {/* Share button */}
      <button
        onClick={handleShare}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-jsconf-yellow text-black font-mono text-xs font-bold hover:bg-jsconf-yellow/90 transition-colors"
      >
        <Share2 className="h-3 w-3" />
        {copied ? "¡Copiado!" : "Compartir"}
      </button>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="shrink-0 text-jsconf-muted hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// Get or create a persistent anonymous token for this attendee
function getAttendeeToken(): string {
  if (typeof window === "undefined") return ""
  let token = localStorage.getItem(STORAGE_KEYS.attendeeToken)
  if (!token) {
    token = `anon_${Math.random().toString(36).slice(2, 11)}_${Date.now().toString(36)}`
    localStorage.setItem(STORAGE_KEYS.attendeeToken, token)
  }
  return token
}

function AttendeePageInner() {
  const searchParams = useSearchParams()
  const room = searchParams.get("room") ?? undefined
  const sessionId = searchParams.get("session") ?? null

  const [sessionFinished, setSessionFinished] = useState(false)
  const [finishedSessionId, setFinishedSessionId] = useState<string | null>(null)
  const [attendeeToken] = useState(() => getAttendeeToken())

  const handlePartyMessage = useCallback((msg: { type: string; sessionId?: string }) => {
    if (msg.type === "session_finished") {
      setSessionFinished(true)
      setFinishedSessionId(msg.sessionId ?? sessionId)
    }
  }, [sessionId])

  const { state, send, connectionCount, isConnected } = useParty(room, handlePartyMessage as any)

  // Also check if session is already finished when connecting (e.g. scanning QR after session ended)
  useEffect(() => {
    if (!sessionId) return
    async function checkStatus() {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { data } = await supabase
        .from("sessions")
        .select("status, id")
        .eq("id", sessionId)
        .single()
      if (data?.status === "finished") {
        setSessionFinished(true)
        setFinishedSessionId(data.id)
      }
    }
    checkStatus()
  }, [sessionId])

  // Show feedback screen if session has ended
  if (sessionFinished && finishedSessionId) {
    return (
      <div className="min-h-screen bg-jsconf-bg">
        <Header connectionCount={0} isConnected={false} currentTalk="" />
        <FeedbackScreen
          sessionId={finishedSessionId}
          talkTitle={state.currentTalk || "Session"}
          attendeeToken={attendeeToken}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-jsconf-bg">
      <Header
        connectionCount={connectionCount}
        isConnected={isConnected}
        currentTalk={state.currentTalk}
      />

      {/* Alert Banner */}
      {state.alert && state.alert.expiresAt > Date.now() && (
        <div className="bg-jsconf-yellow text-black px-4 py-3 text-center font-display font-bold uppercase tracking-wide">
          {state.alert.text}
        </div>
      )}

      {/* Main Content */}
      <main className="px-4 py-4">
        <Tabs defaultValue="react" className="w-full">
          <TabsList className="w-full h-12 p-0 bg-transparent border-b border-jsconf-border rounded-none gap-0">
            <TabsTrigger
              value="react"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-jsconf-yellow data-[state=active]:text-white data-[state=active]:font-bold text-jsconf-muted font-mono uppercase tracking-wide text-sm transition-all duration-150 bg-transparent data-[state=active]:bg-transparent"
            >
              <Zap className="h-4 w-4 mr-2" />
              React
            </TabsTrigger>
            <TabsTrigger
              value="ask"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-jsconf-yellow data-[state=active]:text-white data-[state=active]:font-bold text-jsconf-muted font-mono uppercase tracking-wide text-sm transition-all duration-150 bg-transparent data-[state=active]:bg-transparent"
            >
              <MessageCircleQuestion className="h-4 w-4 mr-2" />
              Ask
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-jsconf-yellow data-[state=active]:text-white data-[state=active]:font-bold text-jsconf-muted font-mono uppercase tracking-wide text-sm transition-all duration-150 bg-transparent data-[state=active]:bg-transparent"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="react" className="mt-0">
              <ReactTab send={send} />
            </TabsContent>

            <TabsContent value="ask" className="mt-0">
              <AskTab send={send} questions={state.questions} sessionId={sessionId} />
            </TabsContent>

            <TabsContent value="schedule" className="mt-0">
              <ScheduleTab send={send} sessions={state.sessions} attendance={state.attendance} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  )
}

export default function AttendeePage() {
  return (
    <Suspense fallback={null}>
      <AttendeePageInner />
    </Suspense>
  )
}
