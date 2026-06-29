"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { createClient } from "@/lib/supabase/client"
import { getSessionById, finishSession } from "@/lib/db"
import { useParty } from "@/hooks/use-party"
import { EmojiBurst } from "@/components/wall/emoji-burst"
import { Pin, PinOff, ExternalLink, Smartphone } from "lucide-react"
import { PresenterQuestionCard } from "@/components/shared/question-card"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TalkRow {
  id: string
  title: string
  slide_url: string | null
  slide_type: string | null
}

interface SessionRow {
  id: string
  partykit_room: string
  ended_at: string | null
  talks: TalkRow
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
    </svg>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PresentPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<SessionRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appUrl, setAppUrl] = useState("")

  // UI state
  const [qaOpen, setQaOpen] = useState(false)
  const [qaPinned, setQaPinned] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [ending, setEnding] = useState(false)

  // Phone remote
  const [showRemote, setShowRemote] = useState(false)
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null)
  const [remoteLoading, setRemoteLoading] = useState(false)
  const [remoteError, setRemoteError] = useState<string | null>(null)

  // File-based slides (Phase 4.1)
  const [fileSlides, setFileSlides] = useState<string[]>([])
  const [currentFileSlideIndex, setCurrentFileSlideIndex] = useState(0)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const qaPanelRef = useRef<HTMLDivElement>(null)

  // Determine slide mode early (before callbacks) — determined after session load
  const hasSlide = session?.talks?.slide_url && (session?.talks?.slide_type === "url" || session?.talks?.slide_type === "file")
  const isFileSlide = session?.talks?.slide_type === "file"

  // ── Fetch session on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppUrl(window.location.origin + "/app")
    }

    async function load() {
      const supabase = createClient()
      const data = await getSessionById(supabase, sessionId)

      if (!data) {
        setError("Session not found")
        setLoading(false)
        return
      }

      setSession(data as unknown as SessionRow)
      
      // Load file-based slides if present (Phase 4.1)
      if (data.talks?.slide_type === "file" && data.talks?.slide_url) {
        try {
          const manifest = await fetch(data.talks.slide_url).then(r => r.json())
          if (Array.isArray(manifest.slides)) {
            setFileSlides(manifest.slides)
          }
        } catch (err) {
          console.error("Failed to load slide manifest:", err)
        }
      }

      setLoading(false)
      setAppUrl(`${window.location.origin}/app?room=${data.partykit_room}&session=${data.id}`)
    }

    load()
  }, [sessionId])

  // ── Slide navigation helpers (supports both iframe + file slides) ──────────────
  const postToIframe = useCallback((method: "next" | "prev" | "up" | "down") => {
    iframeRef.current?.contentWindow?.postMessage({ method }, "*")
  }, [])

  const slideNext = useCallback(() => {
    if (isFileSlide && fileSlides.length > 0) {
      setCurrentFileSlideIndex(i => Math.min(i + 1, fileSlides.length - 1))
    } else {
      postToIframe("next")
    }
  }, [isFileSlide, fileSlides.length, postToIframe])

  const slidePrev = useCallback(() => {
    if (isFileSlide && fileSlides.length > 0) {
      setCurrentFileSlideIndex(i => Math.max(i - 1, 0))
    } else {
      postToIframe("prev")
    }
  }, [isFileSlide, fileSlides.length, postToIframe])

  const slideUp = useCallback(() => postToIframe("up"), [postToIframe])
  const slideDown = useCallback(() => postToIframe("down"), [postToIframe])

  // ── PartyKit ────────────────────────────────────────────────────────────────
  const roomName = session?.partykit_room ?? "__disconnected__"

  const handlePartyMessage = useCallback(
    (msg: { type: string; questionId?: string }) => {
      if (msg.type === "slide_next") slideNext()
      if (msg.type === "slide_prev") slidePrev()
      if (msg.type === "slide_up") slideUp()
      if (msg.type === "slide_down") slideDown()
      if (msg.type === "highlight_question") {
        setQaOpen(true)
      }
    },
    [slideNext, slidePrev, slideUp, slideDown],
  )

  const { state, connectionCount, isConnected, send } = useParty(roomName, handlePartyMessage as any)

  // ── Click-outside closes panel when not pinned ──────────────────────────────
  useEffect(() => {
    if (!qaOpen || qaPinned) return
    function handleClickOutside(e: MouseEvent) {
      if (qaPanelRef.current && !qaPanelRef.current.contains(e.target as Node)) {
        setQaOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [qaOpen, qaPinned])

  // ── Controls auto-hide ──────────────────────────────────────────────────────
  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true)
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 2500)
  }, [])

  useEffect(() => {
    resetControlsTimer()
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    }
  }, [resetControlsTimer])

  // ── Keyboard shortcuts ───────────────────────��──────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === "INPUT") return
      if (e.key === "ArrowRight") { sendSlide("next"); slideNext() }
      else if (e.key === "ArrowLeft") { sendSlide("prev"); slidePrev() }
      else if (e.key === "ArrowUp") { e.preventDefault(); postToIframe("up") }
      else if (e.key === "ArrowDown") { e.preventDefault(); postToIframe("down") }
      else if (e.key === "q" || e.key === "Q") setQaOpen((v) => !v)
      else if (e.key === "f" || e.key === "F") toggleFullscreen()
      else if (e.key === "Escape") {
        if (qaOpen) setQaOpen(false)
        else setShowEndConfirm(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [qaOpen, slideNext, slidePrev, slideUp, slideDown]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Slide control + broadcast ───────────────────────��───────────────────────
  const sendSlide = (dir: "next" | "prev") => {
    send({ type: dir === "next" ? "slide_next" : "slide_prev" })
  }

  const handleSlideNext = () => { sendSlide("next"); slideNext() }
  const handleSlidePrev = () => { sendSlide("prev"); slidePrev() }

  // ── Fullscreen ──────────────────────────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // ── End session ─────────────────────────────────────────────────────────────
  const handleEndSession = async () => {
    setEnding(true)
    const supabase = createClient()
    // Broadcast to all attendees that the session is finished
    send({ type: "session_finished", sessionId })

    // Persist the final Q&A so it appears in the dashboard history.
    // Best-effort: never block ending the session on this.
    try {
      await fetch("/api/sessions/snapshot-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questions: state.questions }),
      })
    } catch (err) {
      console.error("[v0] Failed to snapshot Q&A:", (err as Error).message)
    }

    await finishSession(supabase, sessionId)
    router.push("/dashboard")
  }

  // ── Phone remote ────────────────────────────────────────────────────────────
  const openRemote = async () => {
    setShowRemote(true)
    if (remoteUrl) return // reuse the existing token while the modal is open
    setRemoteLoading(true)
    setRemoteError(null)
    try {
      const res = await fetch(`/api/remote/token?sessionId=${sessionId}`)
      if (!res.ok) throw new Error("Failed to create remote link")
      const data = await res.json()
      setRemoteUrl(data.url as string)
    } catch {
      setRemoteError("Couldn't create a remote link. Try again.")
    } finally {
      setRemoteLoading(false)
    }
  }

  // ── Dismiss question ────────────────────────────────────────────────────────
  const handleDismiss = (questionId: string) => {
    send({ type: "answer", questionId })
    setDismissedIds((prev) => new Set(prev).add(questionId))
  }

  // ── Q&A data ────────────────────────────────────────────────────────────────
  const topQuestions = state.questions
    .filter((q) => !q.answered && !dismissedIds.has(q.id))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5)

  // ── Derived ─────────────────────────────────────────────────────────────────
  const talk = session?.talks
  const talkTitle = talk?.title ?? ""

  // ─────────────────────────────────────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-4">
        <ChatBubbleIcon className="w-10 h-10 text-jsconf-yellow animate-pulse" />
        <p className="font-mono text-sm text-jsconf-muted uppercase tracking-widest">Loading session...</p>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Error state
  // ─────────────────────────────────────────────────────────────────────────────
  if (error || !session) {
    return (
      <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-6">
        <p className="font-display font-bold text-white text-2xl uppercase tracking-wide">Session not found</p>
        <a href="/dashboard" className="font-mono text-sm text-jsconf-yellow underline">
          Back to dashboard
        </a>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 overflow-hidden"
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
    >
      {/* ── Layer 0: Slides (iframe, file images, or dark background) ── */}
      {isFileSlide && fileSlides.length > 0 ? (
        <img
          src={fileSlides[currentFileSlideIndex]}
          alt={`Slide ${currentFileSlideIndex + 1}`}
          className="absolute inset-0 w-full h-full object-contain bg-[#080808]"
          style={{ zIndex: 0 }}
        />
      ) : hasSlide ? (
        <iframe
          ref={iframeRef}
          src={session?.talks?.slide_url!}
          className="absolute inset-0 w-full h-full border-0"
          allow="fullscreen"
          allowFullScreen
          style={{ zIndex: 0 }}
        />
      ) : (
        <div
          className="absolute inset-0 bg-[#080808] flex items-center justify-center"
          style={{ zIndex: 0 }}
        >
          <p className="font-display font-bold text-white text-4xl uppercase tracking-widest text-center px-16 text-balance">
            {talkTitle}
          </p>
        </div>
      )}

      {/* ── Layer 0.5: transparent capture layer — receives mousemove over iframe ── */}
      <div
        className="absolute inset-0"
        style={{ zIndex: 5, pointerEvents: controlsVisible ? "none" : "auto" }}
        onMouseMove={resetControlsTimer}
      />

      {/* ── Layer 1: Overlay ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>

        {/* Emoji burst + text reaction cards */}
        <EmojiBurst reactions={state.reactions} isQAMode={false} />

        {/* Top-left: branding + QR */}
        <div
          className="absolute top-4 left-4 flex flex-col gap-2 p-3 pointer-events-auto"
          style={{
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            border: "1px solid #2a2a2a",
          }}
        >
          <div className="flex items-center gap-1.5">
            <ChatBubbleIcon className="w-4 h-4 text-jsconf-yellow" />
            <span className="font-mono text-xs font-bold text-white tracking-widest uppercase">EVOCA.DEV</span>
          </div>
          {appUrl && (
            <div className="bg-white p-1 max-w-[88px] m-auto">
              <QRCodeSVG value={appUrl} size={80} />
            </div>
          )}
        </div>

        {/* Top-right: connection count */}
        <div
          className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 pointer-events-auto"
          style={{
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            border: "1px solid #2a2a2a",
          }}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: isConnected ? "#4ade80" : "#ef4444" }}
            />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ background: isConnected ? "#22c55e" : "#ef4444" }}
            />
          </span>
          <span className="font-mono text-sm text-white">{connectionCount} online</span>
        </div>

        {/* Right-side Q&A panel */}
        <div
          ref={qaPanelRef}
          className="absolute top-0 right-0 h-full flex items-stretch pointer-events-auto"
        >
          {/* Collapsed tab */}
          {!qaOpen && (
            <button
              onClick={() => setQaOpen(true)}
              className="self-center font-mono text-xs uppercase tracking-wider text-white py-4 px-2 flex flex-col items-center gap-2"
              style={{
                background: "#111",
                border: "1px solid #2a2a2a",
                borderRight: "none",
                writingMode: "vertical-rl",
              }}
            >
              Q&A ({topQuestions.length})
            </button>
          )}

          {/* Expanded panel */}
          {qaOpen && (
            <div
              className="w-80 h-full flex flex-col"
              style={{
                background: "rgba(8,8,8,0.92)",
                backdropFilter: "blur(12px)",
                borderLeft: "1px solid #2a2a2a",
              }}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
                <span className="font-mono text-xs font-bold text-white uppercase tracking-widest">
                  Top Questions
                </span>
                <div className="flex items-center gap-2">
                  {/* Pin toggle */}
                  <button
                    onClick={() => setQaPinned((v) => !v)}
                    title={qaPinned ? "Unpin panel" : "Pin panel (prevents click-outside close)"}
                    className="text-jsconf-muted hover:text-white transition-colors"
                  >
                    {qaPinned ? <Pin className="h-3.5 w-3.5 text-jsconf-yellow" /> : <PinOff className="h-3.5 w-3.5" />}
                  </button>
                  {/* Move to Q&A */}
                  <a
                    href={`/qna/${sessionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open full Q&A in new tab"
                    className="text-jsconf-muted hover:text-white transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  {/* Close */}
                  <button
                    onClick={() => setQaOpen(false)}
                    className="font-mono text-xs text-jsconf-muted hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Questions list */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4">
                {topQuestions.length === 0 ? (
                  <p className="font-mono text-xs text-jsconf-muted text-center mt-8 uppercase tracking-wider">
                    No questions yet
                  </p>
                ) : (
                  topQuestions.map((q) => (
                    <PresenterQuestionCard
                      key={q.id}
                      question={q}
                      onDismiss={handleDismiss}
                    />
                  ))
                )}
              </div>

              {/* Footer: link to full Q&A */}
              <div className="border-t border-[#2a2a2a] p-3">
                <a
                  href={`/qna/${sessionId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 font-mono text-xs uppercase tracking-widest text-jsconf-muted border border-[#2a2a2a] hover:text-white hover:border-white transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open full Q&A tab
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Bottom watermark */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none">
          <ChatBubbleIcon className="w-3 h-3 text-jsconf-muted" />
          <span className="font-mono text-[10px] text-jsconf-muted">Powered by Evoca.dev</span>
        </div>

        {/* Bottom-center controls (auto-hide) */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 pointer-events-auto transition-opacity duration-300"
          style={{
            opacity: controlsVisible ? 1 : 0,
            pointerEvents: controlsVisible ? "auto" : "none",
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            border: "1px solid #2a2a2a",
            borderRadius: "999px",
            padding: "8px 16px",
          }}
        >
          <ControlBtn onClick={handleSlidePrev} title="Previous / up (← ↑)">←</ControlBtn>
          <ControlBtn onClick={handleSlideNext} title="Next / down (→ ↓)">→</ControlBtn>
          <Divider />
          <ControlBtn onClick={toggleFullscreen} title="Toggle fullscreen (F)">⛶</ControlBtn>
          <ControlBtn onClick={() => setQaOpen((v) => !v)} title="Toggle Q&A (Q)">Q</ControlBtn>
          <button
            onClick={openRemote}
            title="Phone remote"
            className="text-white hover:text-jsconf-yellow transition-colors px-3 py-1.5 flex items-center"
          >
            <Smartphone className="h-4 w-4" />
          </button>
          <Divider />
          <button
            onClick={() => setShowEndConfirm(true)}
            title="End session"
            className="font-mono text-xs px-3 py-1.5 transition-colors"
            style={{ color: "#ef4444", border: "1px solid #ef4444", borderRadius: "4px" }}
          >
            End
          </button>
        </div>
      </div>

      {/* ── Phone remote modal ── */}
      {showRemote && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 50, background: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowRemote(false)}
        >
          <div
            className="flex flex-col items-center gap-5 p-8 max-w-xs w-full mx-4"
            style={{ background: "#111", border: "1px solid #2a2a2a" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-jsconf-yellow" />
              <p className="font-display font-bold text-white text-lg uppercase tracking-wide">
                Phone remote
              </p>
            </div>

            {remoteLoading && (
              <p className="font-mono text-xs text-jsconf-muted py-12">Creating link...</p>
            )}

            {remoteError && (
              <p className="font-mono text-xs text-red-400 py-12 text-center">{remoteError}</p>
            )}

            {remoteUrl && !remoteLoading && (
              <>
                <div className="bg-white p-3">
                  <QRCodeSVG value={remoteUrl} size={180} />
                </div>
                <p className="font-mono text-xs text-jsconf-muted text-center text-balance">
                  Scan with your phone to control slides. No login needed — link expires in 8 hours.
                </p>
              </>
            )}

            <button
              onClick={() => setShowRemote(false)}
              className="w-full font-mono text-sm py-2 border border-jsconf-border text-jsconf-muted hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── End session confirmation modal ── */}
      {showEndConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 50, background: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowEndConfirm(false)}
        >
          <div
            className="flex flex-col gap-6 p-8 max-w-sm w-full mx-4"
            style={{ background: "#111", border: "1px solid #2a2a2a" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="font-display font-bold text-white text-xl uppercase tracking-wide mb-2">
                End this session?
              </p>
              <p className="font-mono text-xs text-jsconf-muted">
                Attendees will be shown a feedback form. Results will appear in your dashboard.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 font-mono text-sm py-2 border border-[#2a2a2a] text-jsconf-muted hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEndSession}
                disabled={ending}
                className="flex-1 font-mono text-sm py-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {ending ? "Ending..." : "End session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function ControlBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="font-mono text-sm text-white hover:text-jsconf-yellow transition-colors px-3 py-1.5"
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="w-px h-4 bg-[#2a2a2a] mx-1" />
}
