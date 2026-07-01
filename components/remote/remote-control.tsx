"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import PartySocket from "partysocket"
import { PARTY_HOST } from "@/lib/party"
import { ChevronLeft, ChevronRight, Wifi, WifiOff } from "lucide-react"
import { Logo } from "@/components/shared/logo"

/**
 * Phone slide remote (Phase 5.2). Connects to the session's PartyKit room using
 * the speaker-scoped token and broadcasts the same `slide_next` / `slide_prev`
 * commands the presenter view listens for. No login — the token is the auth.
 *
 * The slide counter is a best-effort *local* step count: the presentation runs
 * in a cross-origin iframe on the presenter machine, so the true total/index
 * isn't readable here. It increments/decrements with each tap and never drops
 * below 1.
 */
interface SlidePreview {
  url: string
  index: number
  total: number
}

export function RemoteControl({ room, token }: { room: string; token: string }) {
  const socketRef = useRef<PartySocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [slide, setSlide] = useState(1)
  const [flash, setFlash] = useState<"prev" | "next" | null>(null)
  const [preview, setPreview] = useState<SlidePreview | null>(null)
  const touchStartX = useRef<number | null>(null)

  // ── Connect to the room as the speaker (token grants the role) ──────────────
  useEffect(() => {
    const socket = new PartySocket({ host: PARTY_HOST, room, query: { token } })
    socketRef.current = socket
    const onOpen = () => setConnected(true)
    const onClose = () => setConnected(false)
    const onMessage = (event: MessageEvent) => {
      if (typeof event.data !== "string") return
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === "slide_image" && typeof msg.url === "string") {
          setPreview({ url: msg.url, index: msg.index ?? 0, total: msg.total ?? 0 })
          setSlide((msg.index ?? 0) + 1)
        }
      } catch { /* ignore malformed messages */ }
    }
    socket.addEventListener("open", onOpen)
    socket.addEventListener("close", onClose)
    socket.addEventListener("message", onMessage)
    return () => {
      socket.removeEventListener("open", onOpen)
      socket.removeEventListener("close", onClose)
      socket.removeEventListener("message", onMessage)
      socket.close()
    }
  }, [room, token])

  // ── Keep the phone screen awake while the remote is open ────────────────────
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    let released = false

    async function acquire() {
      try {
        const wl = (navigator as Navigator & { wakeLock?: WakeLock }).wakeLock
        lock = wl ? await wl.request("screen") : null
      } catch {
        /* wake lock unsupported or denied — non-fatal */
      }
    }

    function onVisibility() {
      if (document.visibilityState === "visible" && !released) acquire()
    }

    acquire()
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      released = true
      document.removeEventListener("visibilitychange", onVisibility)
      lock?.release().catch(() => {})
    }
  }, [])

  const send = useCallback((dir: "prev" | "next") => {
    const socket = socketRef.current
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: dir === "next" ? "slide_next" : "slide_prev" }))
    }
    setSlide((n) => (dir === "next" ? n + 1 : Math.max(1, n - 1)))
    setFlash(dir)
    setTimeout(() => setFlash(null), 150)
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(15)
  }, [])

  // ── Swipe gestures ──────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current
    if (start == null) return
    const dx = (e.changedTouches[0]?.clientX ?? start) - start
    if (Math.abs(dx) > 50) send(dx < 0 ? "next" : "prev")
    touchStartX.current = null
  }

  return (
    <div
      className="fixed inset-0 bg-[#080808] flex flex-col select-none touch-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 py-4">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-jsconf-muted">
          <Logo size="xs" showIcon={false} />
          Remote
        </span>
        <span
          className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest ${
            connected ? "text-green-400" : "text-red-400"
          }`}
        >
          {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {connected ? "Connected" : "Reconnecting"}
        </span>
      </div>

      {/* Slide preview / counter */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
        {preview ? (
          <>
            {/* Slide thumbnail */}
            <div className="w-full max-w-xs border border-jsconf-border bg-black overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.url}
                alt={`Slide ${preview.index + 1}`}
                className="w-full object-contain"
                style={{ maxHeight: "200px" }}
              />
            </div>
            <div className="flex items-center gap-1.5 font-mono text-sm text-jsconf-muted">
              <span className="text-white font-bold">{preview.index + 1}</span>
              <span>/</span>
              <span>{preview.total}</span>
            </div>
          </>
        ) : (
          <>
            <span className="font-mono text-xs uppercase tracking-widest text-jsconf-muted">Slide</span>
            <span className="font-display font-bold text-white text-7xl tabular-nums">{slide}</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-jsconf-muted mt-2">
              Swipe or tap below
            </span>
          </>
        )}
      </div>

      {/* Big tap targets */}
      <div className="grid grid-cols-2 gap-3 p-4 pb-8">
        <button
          onClick={() => send("prev")}
          aria-label="Previous slide"
          className={`flex flex-col items-center justify-center gap-2 py-10 border transition-colors ${
            flash === "prev"
              ? "bg-jsconf-yellow text-black border-jsconf-yellow"
              : "bg-jsconf-surface text-white border-jsconf-border active:bg-jsconf-surface-2"
          }`}
        >
          <ChevronLeft className="h-10 w-10" />
          <span className="font-mono text-xs uppercase tracking-wider">Prev</span>
        </button>
        <button
          onClick={() => send("next")}
          aria-label="Next slide"
          className={`flex flex-col items-center justify-center gap-2 py-10 border transition-colors ${
            flash === "next"
              ? "bg-jsconf-yellow text-black border-jsconf-yellow"
              : "bg-jsconf-yellow text-black border-jsconf-yellow active:opacity-80"
          }`}
        >
          <ChevronRight className="h-10 w-10" />
          <span className="font-mono text-xs uppercase tracking-wider">Next</span>
        </button>
      </div>
    </div>
  )
}
