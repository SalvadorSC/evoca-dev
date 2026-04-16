"use client"

import { useEffect, useState, useMemo } from "react"
import { SESSIONS } from "@/lib/sessions"
import type { Session } from "@/lib/types"

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function formatCountdown(minutes: number): string {
  if (minutes < 0) return "00:00"
  const m = Math.floor(minutes)
  const s = Math.floor((minutes * 60) % 60)
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

interface NowNextBarProps {
  liveSessions?: Session[]
}

export function NowNextBar({ liveSessions = [] }: NowNextBarProps) {
  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState<Date>(() => new Date())

  useEffect(() => {
    setMounted(true)
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Merge live sessions with defaults
  const sessions = useMemo(() => {
    if (liveSessions.length === 0) return SESSIONS
    const liveMap = new Map(liveSessions.map((s) => [s.id, s]))
    return SESSIONS.map((s) => liveMap.get(s.id) || s)
  }, [liveSessions])

  // Calculate current time in minutes - use a stable initial value for SSR
  const currentMinutes = useMemo(() => {
    if (!mounted) return 0 // Stable value for SSR
    return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  }, [mounted, now])

  // Find current and next sessions (excluding cancelled)
  const { currentSession, nextSession } = useMemo(() => {
    if (!mounted) return { currentSession: null, nextSession: null }

    const activeSessions = sessions.filter((s) => !s.cancelled)

    let current: Session | null = null
    let next: Session | null = null

    for (const session of activeSessions) {
      const startMin = timeToMinutes(session.start)
      const endMin = timeToMinutes(session.end)

      if (currentMinutes >= startMin && currentMinutes < endMin) {
        current = session
      } else if (currentMinutes < startMin && !next) {
        next = session
      }
    }

    // If we have a current session, find the next one after it
    if (current) {
      const currentEndMin = timeToMinutes(current.end)
      for (const session of activeSessions) {
        const startMin = timeToMinutes(session.start)
        if (startMin >= currentEndMin && (!next || startMin < timeToMinutes(next.start))) {
          next = session
        }
      }
    }

    return { currentSession: current, nextSession: next }
  }, [sessions, currentMinutes, mounted])

  // Calculate countdowns
  const currentEndsIn = currentSession
    ? timeToMinutes(currentSession.end) - currentMinutes
    : 0

  const nextStartsIn = nextSession
    ? timeToMinutes(nextSession.start) - currentMinutes
    : 0

  const isBreak = currentSession?.type === "break"

  // Show loading state until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center justify-between bg-black/90 border-t border-jsconf-border px-6 py-3">
        <div className="text-jsconf-muted font-sans">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between bg-black/90 border-t border-jsconf-border px-6 py-3">
      {/* NOW section */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {currentSession ? (
          <>
            <div className="flex items-center gap-2 shrink-0">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-jsconf-red opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-jsconf-red"></span>
              </span>
              <span className="font-display font-bold text-jsconf-red text-sm uppercase tracking-widest">
                EN DIRECTO
              </span>
            </div>
            <div className="flex-1 min-w-0 truncate">
              <span className="font-display font-semibold text-white truncate">
                {currentSession.title}
              </span>
              {currentSession.speaker && !isBreak && (
                <span className="text-jsconf-muted ml-2 font-sans">
                  {currentSession.speaker.name}
                </span>
              )}
            </div>
            <div className="shrink-0 font-mono text-jsconf-muted bg-jsconf-surface px-3 py-1 border border-jsconf-border">
              ends in {formatCountdown(currentEndsIn)}
            </div>
          </>
        ) : (
          <div className="text-jsconf-muted font-sans">No session in progress</div>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-jsconf-border mx-6" />

      {/* NEXT section */}
      <div className="flex items-center gap-4 shrink-0">
        {nextSession ? (
          <>
            <span className="font-display font-bold text-jsconf-yellow text-sm uppercase tracking-widest">
              NEXT
            </span>
            <span className="text-white font-sans truncate max-w-[200px]">
              {nextSession.title}
            </span>
            <span className="font-mono text-jsconf-muted text-sm">
              in {Math.round(nextStartsIn)} min
            </span>
          </>
        ) : (
          <span className="text-jsconf-muted font-sans">No more sessions</span>
        )}
      </div>
    </div>
  )
}
