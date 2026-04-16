"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Check, HelpCircle, X, Share2, Download, AlertTriangle, Users, ChevronDown } from "lucide-react"
import { SESSIONS } from "@/lib/sessions"
import type { Session, AttendanceRecord, AttendeeInfo, ClientMessage } from "@/lib/types"
import { STORAGE_KEYS } from "@/lib/storage-keys"

type Filter = "all" | "talk" | "workshop" | "lightning"

interface ScheduleTabProps {
  send: (message: ClientMessage) => void
  sessions: Session[]
  attendance: AttendanceRecord
}

function getUserId(): string {
  if (typeof window === "undefined") return ""
  let userId = localStorage.getItem(STORAGE_KEYS.userId)
  if (!userId) {
    userId = `user_${Math.random().toString(36).substring(2, 11)}`
    localStorage.setItem(STORAGE_KEYS.userId, userId)
  }
  return userId
}

function getDisplayName(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_KEYS.displayName)
}

function setDisplayNameStorage(name: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.displayName, name)
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function isSessionNow(session: Session): boolean {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  return currentMinutes >= timeToMinutes(session.start) && currentMinutes < timeToMinutes(session.end)
}

function sessionsOverlap(s1: Session, s2: Session): boolean {
  const s1Start = timeToMinutes(s1.start)
  const s1End = timeToMinutes(s1.end)
  const s2Start = timeToMinutes(s2.start)
  const s2End = timeToMinutes(s2.end)
  return s1Start < s2End && s2Start < s1End
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase()
}

export function ScheduleTab({ send, sessions: liveSessions, attendance }: ScheduleTabProps) {
  const [filter, setFilter] = useState<Filter>("all")
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareImage, setShareImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [nameInput, setNameInput] = useState("")
  const [displayName, setDisplayName] = useState<string | null>(null)
  const posterRef = useRef<HTMLDivElement>(null)
  const [, setTick] = useState(0)
  const hasCheckedName = useRef(false)

  const userId = useMemo(() => getUserId(), [])

  // Check for display name on first visit
  useEffect(() => {
    if (hasCheckedName.current) return
    hasCheckedName.current = true

    const savedName = getDisplayName()
    if (savedName) {
      setDisplayName(savedName)
    } else {
      setShowNamePrompt(true)
    }
  }, [])

  const handleSetName = () => {
    const trimmed = nameInput.trim()
    if (trimmed) {
      setDisplayNameStorage(trimmed)
      setDisplayName(trimmed)
      setShowNamePrompt(false)
    }
  }

  // Merge live sessions with default
  const sessions = useMemo(() => {
    if (liveSessions.length === 0) return SESSIONS
    const liveMap = new Map(liveSessions.map((s) => [s.id, s]))
    return SESSIONS.map((s) => liveMap.get(s.id) || s)
  }, [liveSessions])

  // Tick every minute for NOW indicator
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  // Ensure attendance is always a valid record
  const safeAttendance = (attendance && typeof attendance === "object" && !Array.isArray(attendance))
    ? attendance
    : {} as AttendanceRecord

  const myAttendance = useMemo(() => {
    const map = new Map<string, "going" | "maybe" | "skip">()
    sessions.forEach((s) => {
      const att = safeAttendance[s.id]
      if (!att) return
      if (att.going.some((u) => u.userId === userId)) map.set(s.id, "going")
      else if (att.maybe.some((u) => u.userId === userId)) map.set(s.id, "maybe")
    })
    return map
  }, [sessions, safeAttendance, userId])

  const attendanceCounts = useMemo(() => {
    const counts = new Map<string, { going: number; maybe: number }>()
    sessions.forEach((s) => {
      const att = safeAttendance[s.id] || { going: [], maybe: [] }
      counts.set(s.id, { going: att.going.length, maybe: att.maybe.length })
    })
    return counts
  }, [sessions, safeAttendance])

  // Group attendance by session
  const attendeesBySession = useMemo(() => {
    const map = new Map<string, { going: AttendeeInfo[]; maybe: AttendeeInfo[] }>()
    sessions.forEach((s) => {
      map.set(s.id, safeAttendance[s.id] || { going: [], maybe: [] })
    })
    return map
  }, [sessions, safeAttendance])

  const goingSessions = useMemo(
    () => sessions.filter((s) => myAttendance.get(s.id) === "going"),
    [sessions, myAttendance]
  )

  const conflicts = useMemo(() => {
    const conflictIds = new Set<string>()
    for (let i = 0; i < goingSessions.length; i++) {
      for (let j = i + 1; j < goingSessions.length; j++) {
        if (sessionsOverlap(goingSessions[i], goingSessions[j])) {
          conflictIds.add(goingSessions[i].id)
          conflictIds.add(goingSessions[j].id)
        }
      }
    }
    return conflictIds
  }, [goingSessions])

  const filteredSessions = useMemo(() => {
    if (filter === "all") return sessions
    return sessions.filter((s) => s.type === filter)
  }, [sessions, filter])

  // Group by time slot
  const groupedSessions = useMemo(() => {
    const groups = new Map<string, Session[]>()
    filteredSessions.forEach((s) => {
      const key = `${s.start}-${s.end}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(s)
    })
    return Array.from(groups.entries())
      .sort(([a], [b]) => timeToMinutes(a.split("-")[0]) - timeToMinutes(b.split("-")[0]))
  }, [filteredSessions])

  const handleAttend = (sessionId: string, status: "going" | "maybe" | "skip") => {
    send({ type: "attend", sessionId, status, userId, displayName: displayName || "Anonymous" })
  }

  const generateShareImage = async () => {
    if (!posterRef.current) return
    setIsGenerating(true)
    try {
      const { toPng } = await import("html-to-image")
      const dataUrl = await toPng(posterRef.current, {
        backgroundColor: "#080808",
        pixelRatio: 2,
        skipFonts: true,
        style: {
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
      })
      setShareImage(dataUrl)
      setShowShareModal(true)
    } catch (err) {
      console.error("Failed to generate image:", err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!shareImage) return
    const link = document.createElement("a")
    link.download = "jsconf-es-2026-mi-agenda.png"
    link.href = shareImage
    link.click()
  }

  const handleShareX = () => {
    // Download the image first so user can attach it manually
    if (shareImage) {
      handleDownload()
    }
    const appUrl = typeof window !== "undefined" ? window.location.origin : "https://jsconf.es"
    const text = encodeURIComponent(`Mi agenda para #JSConfES 2026\n\nCrea la tuya en ${appUrl}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank")
  }

  return (
    <div className="space-y-4">
      {/* Name Prompt Dialog */}
      <Dialog open={showNamePrompt} onOpenChange={setShowNamePrompt}>
        <DialogContent className="max-w-sm bg-jsconf-surface border-jsconf-border rounded-none">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-white uppercase tracking-wide">
              Como te llamamos?
            </DialogTitle>
            <DialogDescription className="font-sans text-jsconf-muted">
              Visible para otros asistentes en charlas compartidas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Tu nombre..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetName()}
              autoFocus
              className="bg-jsconf-bg border-jsconf-border rounded-none h-11 font-sans text-white placeholder:text-jsconf-muted focus:border-jsconf-yellow"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSetName}
                className="flex-1 h-11 rounded-none bg-jsconf-yellow text-black font-display font-bold uppercase tracking-wide hover:bg-jsconf-yellow/90"
              >
                Guardar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDisplayNameStorage("Anonymous")
                  setDisplayName("Anonymous")
                  setShowNamePrompt(false)
                }}
                className="rounded-none border-jsconf-border text-jsconf-muted hover:text-white"
              >
                Prefiero no decirlo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Button */}
      <Button
        onClick={generateShareImage}
        disabled={goingSessions.length === 0 || isGenerating}
        className="w-full h-11 rounded-none bg-jsconf-yellow text-black font-display font-bold uppercase tracking-wide hover:bg-jsconf-yellow/90 disabled:opacity-40"
      >
        <Share2 className="h-4 w-4 mr-2" />
        {isGenerating ? "Generating..." : "Share my plan"}
      </Button>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList className="w-full h-10 p-0 bg-transparent border border-jsconf-border rounded-none gap-0">
          <TabsTrigger
            value="all"
            className="flex-1 h-full rounded-none data-[state=active]:bg-jsconf-yellow data-[state=active]:text-black text-jsconf-muted font-mono text-xs uppercase tracking-wider transition-all duration-150"
          >
            All
          </TabsTrigger>
          <TabsTrigger
            value="talk"
            className="flex-1 h-full rounded-none data-[state=active]:bg-jsconf-yellow data-[state=active]:text-black text-jsconf-muted font-mono text-xs uppercase tracking-wider transition-all duration-150"
          >
            Talks
          </TabsTrigger>
          <TabsTrigger
            value="workshop"
            className="flex-1 h-full rounded-none data-[state=active]:bg-jsconf-yellow data-[state=active]:text-black text-jsconf-muted font-mono text-xs uppercase tracking-wider transition-all duration-150"
          >
            Workshops
          </TabsTrigger>
          <TabsTrigger
            value="lightning"
            className="flex-1 h-full rounded-none data-[state=active]:bg-jsconf-yellow data-[state=active]:text-black text-jsconf-muted font-mono text-xs uppercase tracking-wider transition-all duration-150"
          >
            Lightning
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Schedule List */}
      <div className="space-y-3">
        {groupedSessions.map(([timeKey, sessionsInSlot]) => {
          const mainSessions = sessionsInSlot.filter((s) => s.track === "main")
          const workshopSessions = sessionsInSlot.filter((s) => s.track === "workshop")
          const isBreak = sessionsInSlot.every((s) => s.type === "break")

          if (isBreak) {
            const breakSession = sessionsInSlot[0]
            return (
              <div
                key={timeKey}
                className="flex items-center gap-3 py-2 px-3 border border-jsconf-border bg-jsconf-surface text-jsconf-muted"
              >
                <span className="font-mono text-sm text-jsconf-yellow">{breakSession.start}</span>
                <span className="font-sans text-sm">{breakSession.title}</span>
              </div>
            )
          }

          return (
            <div key={timeKey} className="space-y-2">
              {mainSessions.length > 0 && workshopSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-2">
                    {mainSessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        status={myAttendance.get(session.id)}
                        counts={attendanceCounts.get(session.id)}
                        attendees={attendeesBySession.get(session.id)}
                        hasConflict={conflicts.has(session.id)}
                        isNow={isSessionNow(session)}
                        currentUserId={userId}
                        onAttend={handleAttend}
                      />
                    ))}
                  </div>
                  <div className="space-y-2">
                    {workshopSessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        status={myAttendance.get(session.id)}
                        counts={attendanceCounts.get(session.id)}
                        attendees={attendeesBySession.get(session.id)}
                        hasConflict={conflicts.has(session.id)}
                        isNow={isSessionNow(session)}
                        currentUserId={userId}
                        onAttend={handleAttend}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                [...mainSessions, ...workshopSessions].map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    status={myAttendance.get(session.id)}
                    counts={attendanceCounts.get(session.id)}
                    attendees={attendeesBySession.get(session.id)}
                    hasConflict={conflicts.has(session.id)}
                    isNow={isSessionNow(session)}
                    currentUserId={userId}
                    onAttend={handleAttend}
                  />
                ))
              )}
            </div>
          )
        })}
      </div>

      {/* Hidden poster for image generation - Festival lineup style */}
      <div className="absolute -left-[9999px]">
        <div
          ref={posterRef}
          className="w-[400px] p-4"
          style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", backgroundColor: "#080808", color: "#FFFFFF" }}
        >
          {/* Header Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "0.05em", color: "#FFFFFF" }}>
              EVOCA
            </span>
            <span style={{ fontSize: "0.65rem", color: "#888888", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
              2026
            </span>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: "1.25rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
            MI AGENDA
          </h1>

          {/* Sessions - Grid layout for compactness, max 8 sessions */}
          {(() => {
            const sortedSessions = goingSessions.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start))
            const displaySessions = sortedSessions.slice(0, 8)
            const remainingCount = sortedSessions.length - 8

            return (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  {displaySessions.map((session) => (
                    <div
                      key={session.id}
                      style={{
                        borderLeft: "2px solid #F7E018",
                        paddingLeft: "0.5rem",
                        paddingTop: "0.25rem",
                        paddingBottom: "0.25rem",
                      }}
                    >
                      <p style={{
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        fontSize: "0.6rem",
                        color: "#F7E018",
                        marginBottom: "0.125rem"
                      }}>
                        {session.start}
                      </p>
                      <p style={{
                        fontWeight: 600,
                        fontSize: "0.7rem",
                        lineHeight: 1.2,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                      }}>
                        {session.title}
                      </p>
                    </div>
                  ))}
                </div>
                {remainingCount > 0 && (
                  <p style={{
                    textAlign: "center",
                    fontSize: "0.7rem",
                    color: "#888888",
                    marginTop: "0.5rem"
                  }}>
                    +{remainingCount} more sessions
                  </p>
                )}
              </>
            )
          })()}

          {/* Footer */}
          <p style={{ marginTop: "0.75rem", textAlign: "center", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: "0.6rem", color: "#666666" }}>
            evoca.app
          </p>
        </div>
      </div>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-md bg-jsconf-surface border-jsconf-border rounded-none">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-white uppercase tracking-wide">
              Share Your Schedule
            </DialogTitle>
            <DialogDescription className="sr-only">
              Download or share your personalized schedule poster
            </DialogDescription>
          </DialogHeader>
          {shareImage && (
            <div className="space-y-4">
              <img src={shareImage} alt="Schedule poster" className="w-full border border-jsconf-border" />
              <div className="flex gap-2">
                <Button
                  onClick={handleDownload}
                  className="flex-1 h-11 rounded-none bg-jsconf-yellow text-black font-display font-bold uppercase tracking-wide hover:bg-jsconf-yellow/90"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={handleShareX}
                  variant="outline"
                  className="flex-1 h-11 rounded-none border-jsconf-border text-white hover:bg-jsconf-surface-2"
                >
                  Share on X
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Attendee Chip Component
interface AttendeeChipProps {
  attendee: AttendeeInfo
  isCurrentUser: boolean
  isMaybe?: boolean
}

function AttendeeChip({ attendee, isCurrentUser, isMaybe }: AttendeeChipProps) {
  const displayName = attendee.displayName || "Anonymous"
  const isAnonymous = displayName === "Anonymous"
  const initial = getInitial(displayName)

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 font-mono text-xs ${isCurrentUser
          ? "bg-jsconf-yellow text-black font-medium border border-jsconf-yellow"
          : isAnonymous
            ? "bg-jsconf-surface-2 text-jsconf-muted opacity-60 border border-jsconf-border"
            : isMaybe
              ? "bg-jsconf-orange/20 text-jsconf-orange border border-jsconf-orange/30"
              : "bg-jsconf-surface-2 text-white border border-jsconf-border"
        }`}
      title={displayName}
    >
      <div
        className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold ${isCurrentUser
            ? "bg-black text-jsconf-yellow"
            : isAnonymous
              ? "bg-jsconf-border text-jsconf-muted"
              : "bg-jsconf-border"
          }`}
      >
        {isAnonymous ? "?" : initial}
      </div>
      <span className="truncate max-w-[80px]">{displayName}</span>
    </div>
  )
}

interface SessionCardProps {
  session: Session
  status?: "going" | "maybe" | "skip"
  counts?: { going: number; maybe: number }
  attendees?: { going: AttendeeInfo[]; maybe: AttendeeInfo[] }
  hasConflict: boolean
  isNow: boolean
  currentUserId: string
  onAttend: (sessionId: string, status: "going" | "maybe" | "skip") => void
}

function SessionCard({ session, status, counts, attendees, hasConflict, isNow, currentUserId, onAttend }: SessionCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isCancelled = session.cancelled
  const goingCount = counts?.going ?? 0
  const maybeCount = counts?.maybe ?? 0
  const totalInterested = goingCount + maybeCount

  const borderColor = session.track === "main" ? "border-l-jsconf-yellow" : "border-l-jsconf-purple"

  return (
    <div
      className={`bg-jsconf-surface border border-jsconf-border border-l-[3px] p-3 relative ${borderColor} ${isCancelled ? "opacity-40" : ""
        } ${isNow ? "ring-2 ring-jsconf-yellow" : ""}`}
    >
      {/* NOW Badge */}
      {isNow && (
        <Badge className="absolute -top-2 left-3 bg-jsconf-yellow text-black font-mono text-xs uppercase tracking-wider rounded-none">
          NOW
        </Badge>
      )}

      {/* Cancelled Badge */}
      {isCancelled && (
        <Badge className="absolute -top-2 right-3 bg-jsconf-red/20 text-jsconf-red border-jsconf-red/30 font-mono text-xs uppercase tracking-wider rounded-none" variant="outline">
          CANCELADA
        </Badge>
      )}

      {/* Conflict Warning */}
      {hasConflict && !isCancelled && (
        <div className="absolute -top-2 right-3 flex items-center gap-1 text-jsconf-orange bg-jsconf-orange/20 px-2 py-0.5">
          <AlertTriangle className="h-3 w-3" />
          <span className="font-mono text-xs uppercase tracking-wider">Conflict</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Time */}
        <div className="font-mono text-sm text-jsconf-yellow whitespace-nowrap">
          {session.start}
          <br />
          <span className="text-jsconf-muted">{session.end}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge
              className={`rounded-sm font-mono text-xs uppercase tracking-wider ${session.type === "talk"
                  ? "bg-jsconf-blue/20 text-jsconf-blue border-jsconf-blue/30"
                  : session.type === "lightning"
                    ? "bg-jsconf-orange/20 text-jsconf-orange border-jsconf-orange/30"
                    : "bg-jsconf-purple/20 text-jsconf-purple border-jsconf-purple/30"
                }`}
              variant="outline"
            >
              {session.type}
            </Badge>
            <Badge variant="outline" className="rounded-sm font-mono text-xs border-jsconf-border text-jsconf-muted">
              {session.track}
            </Badge>
            {session.lang && (
              <Badge variant="outline" className="rounded-sm font-mono text-xs border-jsconf-border text-jsconf-muted">
                {session.lang}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h4 className={`font-display font-semibold text-sm text-white ${isCancelled ? "line-through" : ""}`}>
            {session.title}
          </h4>

          {/* Speaker */}
          {session.speaker && (
            <p className="font-sans text-xs text-jsconf-muted mt-0.5">
              {session.speaker.name}
              <span className="opacity-70"> - {session.speaker.role}</span>
            </p>
          )}

          {/* Attendance Buttons */}
          {!isCancelled && session.type !== "break" && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => onAttend(session.id, "going")}
                className={`flex items-center gap-1 px-3 py-1.5 font-mono text-xs uppercase tracking-wider border transition-all duration-150 ${status === "going"
                    ? "bg-jsconf-yellow text-black border-jsconf-yellow font-bold"
                    : "bg-transparent text-jsconf-muted border-jsconf-border hover:border-jsconf-yellow hover:text-jsconf-yellow"
                  }`}
              >
                <Check className="h-3 w-3" />
                Going
              </button>
              <button
                onClick={() => onAttend(session.id, "maybe")}
                className={`flex items-center gap-1 px-3 py-1.5 font-mono text-xs uppercase tracking-wider border transition-all duration-150 ${status === "maybe"
                    ? "bg-jsconf-muted text-black border-jsconf-muted font-bold"
                    : "bg-transparent text-jsconf-muted border-jsconf-border hover:border-jsconf-muted hover:text-white"
                  }`}
              >
                <HelpCircle className="h-3 w-3" />
                Maybe
              </button>
              <button
                onClick={() => onAttend(session.id, "skip")}
                className={`flex items-center gap-1 px-3 py-1.5 font-mono text-xs uppercase tracking-wider border transition-all duration-150 ${status === "skip"
                    ? "bg-jsconf-surface-2 text-jsconf-muted border-jsconf-border"
                    : "bg-transparent text-jsconf-muted border-jsconf-border hover:text-jsconf-red hover:border-jsconf-red"
                  }`}
              >
                <X className="h-3 w-3" />
                Skip
              </button>
            </div>
          )}

          {/* Collapsible Attendee List */}
          {!isCancelled && session.type !== "break" && totalInterested > 0 && (
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-2">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-1.5 px-2 py-1 font-mono text-xs text-jsconf-muted hover:text-white transition-colors">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-green-500">{goingCount} going</span>
                  {maybeCount > 0 && (
                    <span>/ {maybeCount} maybe</span>
                  )}
                  <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {/* Going attendees */}
                {attendees && attendees.going.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {attendees.going.map((a) => (
                      <AttendeeChip
                        key={a.userId}
                        attendee={a}
                        isCurrentUser={a.userId === currentUserId}
                      />
                    ))}
                  </div>
                )}
                {/* Maybe attendees */}
                {attendees && attendees.maybe.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {attendees.maybe.map((a) => (
                      <AttendeeChip
                        key={a.userId}
                        attendee={a}
                        isCurrentUser={a.userId === currentUserId}
                        isMaybe
                      />
                    ))}
                  </div>
                )}
                {/* Empty state - only current user going */}
                {attendees && attendees.going.length === 1 && attendees.going[0].userId === currentUserId && attendees.maybe.length === 0 && (
                  <p className="font-sans text-xs text-jsconf-muted italic">
                    Se el primero! Nadie mas ha marcado esta charla aun.
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  )
}
