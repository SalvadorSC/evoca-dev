"use client"

import { useState, useEffect, useMemo } from "react"
import { useParty } from "@/hooks/use-party"
import { Header } from "@/components/shared/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Flag, Send, Lock, AlertTriangle, Pencil, XCircle, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { SESSIONS } from "@/lib/sessions"
import type { Session } from "@/lib/types"

const ADMIN_PASSWORD = "jsconf2026"

export default function AdminPage() {
  const { state, send, connectionCount, isConnected } = useParty()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState(false)
  const [talkTitle, setTalkTitle] = useState("")
  const [alertText, setAlertText] = useState("")

  // Session editing state
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [editForm, setEditForm] = useState({
    title: "",
    start: "",
    end: "",
    track: "main" as "main" | "workshop",
  })
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null)

  useEffect(() => {
    const auth = sessionStorage.getItem("jsconf-admin-auth")
    if (auth === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  // Merge live sessions with default sessions
  const sessions = useMemo(() => {
    const liveSessions = state.sessions
    if (liveSessions.length === 0) return SESSIONS
    const liveMap = new Map(liveSessions.map((s) => [s.id, s]))
    return SESSIONS.map((s) => liveMap.get(s.id) || s)
  }, [state.sessions])

  // Calculate attendance counts from Record<sessionId, { going: [], maybe: [] }>
  const attendanceCounts = useMemo(() => {
    const counts = new Map<string, { going: number; maybe: number }>()
    const attendance = state.attendance || {}
    sessions.forEach((s) => {
      const att = attendance[s.id] || { going: [], maybe: [] }
      counts.set(s.id, { going: att.going.length, maybe: att.maybe.length })
    })
    return counts
  }, [sessions, state.attendance])

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      sessionStorage.setItem("jsconf-admin-auth", "true")
      setPasswordError(false)
    } else {
      setPasswordError(true)
    }
  }

  const handleSetTalk = () => {
    if (!talkTitle.trim()) return
    send({ type: "set_talk", title: talkTitle.trim() })
    setTalkTitle("")
  }

  const handleModeToggle = (checked: boolean) => {
    send({ type: "set_mode", mode: checked ? "qa" : "wall" })
  }

  const handleFlag = (messageId: string) => {
    send({ type: "flag", messageId })
  }

  const handlePushAlert = () => {
    if (!alertText.trim()) return
    send({ type: "push_alert", text: alertText.trim() })
    setAlertText("")
  }

  const handleEditSession = (session: Session) => {
    setEditingSession(session)
    setEditForm({
      title: session.title,
      start: session.start,
      end: session.end,
      track: session.track,
    })
  }

  const handleSaveSession = () => {
    if (!editingSession) return
    const updatedSession: Session = {
      ...editingSession,
      title: editForm.title,
      start: editForm.start,
      end: editForm.end,
      track: editForm.track,
    }
    send({ type: "update_session", session: updatedSession })
    setEditingSession(null)
  }

  const handleCancelSession = (sessionId: string) => {
    send({ type: "cancel_session", sessionId })
    setCancelConfirm(null)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-jsconf-bg flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-jsconf-surface border border-jsconf-border p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-jsconf-yellow-dim flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-jsconf-yellow" />
            </div>
            <h1 className="font-display font-bold text-xl text-white uppercase tracking-wide">
              Admin Access
            </h1>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="font-mono text-xs text-jsconf-muted uppercase tracking-wide">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError(false)
                }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className={`bg-jsconf-bg border-jsconf-border rounded-none h-11 font-sans text-white placeholder:text-jsconf-muted focus:border-jsconf-yellow ${passwordError ? "border-jsconf-red" : ""
                  }`}
              />
              <Label htmlFor="password" className="font-mono text-xs text-jsconf-muted uppercase tracking-wide">(for demo purposes, jsconf2026 is the password.)</Label>
              {passwordError && (
                <p className="font-mono text-sm text-jsconf-red">Incorrect password</p>
              )}
            </div>
            <Button
              onClick={handleLogin}
              className="w-full h-11 rounded-none bg-jsconf-yellow text-black font-display font-bold uppercase tracking-wide hover:bg-jsconf-yellow/90"
            >
              Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-jsconf-bg">
      <Header
        pageName="Admin"
        connectionCount={connectionCount}
        isConnected={isConnected}
      />

      <main className="p-4 space-y-6 max-w-4xl mx-auto">
        {/* Talk Control */}
        <section className="bg-jsconf-surface border border-jsconf-border p-4">
          <h2 className="font-mono text-xs text-jsconf-muted uppercase tracking-wide flex items-center gap-2 mb-4">
            <span className="w-1 h-4 bg-jsconf-yellow"></span>
            Now Speaking
          </h2>
          {state.currentTalk && (
            <div className="p-3 bg-jsconf-surface-2 border border-jsconf-border mb-4">
              <p className="font-mono text-xs text-jsconf-muted">Current:</p>
              <p className="font-display font-semibold text-white">{state.currentTalk}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Enter talk title..."
              value={talkTitle}
              onChange={(e) => setTalkTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetTalk()}
              className="bg-jsconf-bg border-jsconf-border rounded-none h-10 font-sans text-white placeholder:text-jsconf-muted focus:border-jsconf-yellow"
            />
            <Button
              onClick={handleSetTalk}
              disabled={!talkTitle.trim()}
              className="h-10 px-6 rounded-none bg-jsconf-yellow text-black font-display font-bold uppercase tracking-wide hover:bg-jsconf-yellow/90 disabled:opacity-40"
            >
              Set
            </Button>
          </div>
        </section>

        {/* Mode Toggle */}
        <section className="bg-jsconf-surface border border-jsconf-border p-4">
          <h2 className="font-mono text-xs text-jsconf-muted uppercase tracking-wide flex items-center gap-2 mb-4">
            <span className="w-1 h-4 bg-jsconf-yellow"></span>
            Display Mode
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-semibold text-white uppercase tracking-wide">
                {state.mode === "wall" ? "Wall Mode" : "Q&A Mode"}
              </p>
              <p className="font-sans text-sm text-jsconf-muted">
                {state.mode === "wall"
                  ? "Showing reactions on the projector"
                  : "Showing top questions on the projector"}
              </p>
            </div>
            <Switch
              checked={state.mode === "qa"}
              onCheckedChange={handleModeToggle}
            />
          </div>
        </section>

        {/* Push Alert */}
        <section className="bg-jsconf-surface border border-jsconf-border p-4">
          <h2 className="font-mono text-xs text-jsconf-muted uppercase tracking-wide flex items-center gap-2 mb-4">
            <span className="w-1 h-4 bg-jsconf-yellow"></span>
            <AlertTriangle className="h-4 w-4" />
            Push Alert
          </h2>
          <p className="font-sans text-sm text-jsconf-muted mb-4">
            Send an alert that displays on /wall for 30 seconds
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Alert message..."
              value={alertText}
              onChange={(e) => setAlertText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePushAlert()}
              className="bg-jsconf-bg border-jsconf-border rounded-none h-10 font-sans text-white placeholder:text-jsconf-muted focus:border-jsconf-yellow"
            />
            <Button
              onClick={handlePushAlert}
              disabled={!alertText.trim()}
              className="h-10 px-4 rounded-none bg-jsconf-yellow text-black font-display font-bold hover:bg-jsconf-yellow/90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Schedule Management */}
        <section className="bg-jsconf-surface border border-jsconf-border p-4">
          <h2 className="font-mono text-xs text-jsconf-muted uppercase tracking-wide flex items-center gap-2 mb-4">
            <span className="w-1 h-4 bg-jsconf-yellow"></span>
            Schedule Management
          </h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {sessions
              .filter((s) => s.type !== "break")
              .map((session) => {
                const counts = attendanceCounts.get(session.id)
                return (
                  <div
                    key={session.id}
                    className={`flex items-start gap-3 p-3 border ${session.cancelled
                      ? "bg-jsconf-red/10 border-jsconf-red/30"
                      : "bg-jsconf-surface-2 border-jsconf-border"
                      }`}
                  >
                    <div className="font-mono text-sm text-jsconf-muted whitespace-nowrap">
                      {session.start}
                      <br />
                      {session.end}
                    </div>
                    <div className="flex-1 min-w-0">
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
                        {session.cancelled && (
                          <Badge className="rounded-sm font-mono text-xs uppercase bg-jsconf-red/20 text-jsconf-red border-jsconf-red/30" variant="outline">
                            CANCELADA
                          </Badge>
                        )}
                      </div>
                      <p
                        className={`font-display font-semibold text-sm text-white ${session.cancelled ? "line-through opacity-60" : ""
                          }`}
                      >
                        {session.title}
                      </p>
                      {session.speaker && (
                        <p className="font-sans text-xs text-jsconf-muted">
                          {session.speaker.name}
                        </p>
                      )}
                      {counts && (
                        <div className="flex items-center gap-2 mt-1 font-mono text-xs text-jsconf-muted">
                          <Users className="h-3 w-3" />
                          <span className="text-green-500">{counts.going} going</span>
                          <span>·</span>
                          <span className="text-jsconf-orange">{counts.maybe} maybe</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditSession(session)}
                        disabled={session.cancelled}
                        className="h-8 px-2 rounded-none border-jsconf-border text-jsconf-muted hover:text-white hover:border-jsconf-yellow"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCancelConfirm(session.id)}
                        disabled={session.cancelled}
                        className="h-8 px-2 rounded-none border-jsconf-red/50 text-jsconf-red hover:bg-jsconf-red/10"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
          </div>
        </section>

        {/* Reactions List */}
        <section className="bg-jsconf-surface border border-jsconf-border p-4">
          <h2 className="font-mono text-xs text-jsconf-muted uppercase tracking-wide flex items-center gap-2 mb-4">
            <span className="w-1 h-4 bg-jsconf-yellow"></span>
            Reactions ({state.reactions.length})
          </h2>
          {state.reactions.length === 0 ? (
            <p className="font-sans text-sm text-jsconf-muted text-center py-4">
              No reactions yet
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {[...state.reactions]
                .sort((a, b) => b.ts - a.ts)
                .map((reaction) => (
                  <div
                    key={reaction.id}
                    className={`flex items-start gap-3 p-3 border ${reaction.flags >= 3
                      ? "bg-jsconf-red/10 border-jsconf-red/30"
                      : "bg-jsconf-surface-2 border-jsconf-border"
                      }`}
                  >
                    <span className="text-2xl">{reaction.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm text-white">{reaction.text}</p>
                      <p className="font-mono text-xs text-jsconf-muted mt-1">
                        {reaction.name} ·{" "}
                        {formatDistanceToNow(reaction.ts, { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {reaction.flags > 0 && (
                        <span className="font-mono text-xs text-jsconf-red font-medium">
                          {reaction.flags} flags
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFlag(reaction.id)}
                        className={`h-8 px-2 rounded-none ${reaction.flags >= 3
                          ? "bg-jsconf-red/20 border-jsconf-red text-jsconf-red"
                          : "border-jsconf-border text-jsconf-muted hover:border-jsconf-red hover:text-jsconf-red"
                          }`}
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      </main>

      {/* Edit Session Dialog */}
      <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
        <DialogContent className="bg-jsconf-surface border-jsconf-border rounded-none">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-white uppercase tracking-wide">
              Edit Session
            </DialogTitle>
            <DialogDescription className="sr-only">
              Edit session details including title, time, and track
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="font-mono text-xs text-jsconf-muted uppercase tracking-wide">
                Title
              </Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                className="bg-jsconf-bg border-jsconf-border rounded-none h-10 font-sans text-white focus:border-jsconf-yellow"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start" className="font-mono text-xs text-jsconf-muted uppercase tracking-wide">
                  Start Time
                </Label>
                <Input
                  id="edit-start"
                  type="time"
                  value={editForm.start}
                  onChange={(e) => setEditForm((f) => ({ ...f, start: e.target.value }))}
                  className="bg-jsconf-bg border-jsconf-border rounded-none h-10 font-mono text-white focus:border-jsconf-yellow"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end" className="font-mono text-xs text-jsconf-muted uppercase tracking-wide">
                  End Time
                </Label>
                <Input
                  id="edit-end"
                  type="time"
                  value={editForm.end}
                  onChange={(e) => setEditForm((f) => ({ ...f, end: e.target.value }))}
                  className="bg-jsconf-bg border-jsconf-border rounded-none h-10 font-mono text-white focus:border-jsconf-yellow"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-track" className="font-mono text-xs text-jsconf-muted uppercase tracking-wide">
                Track
              </Label>
              <Select
                value={editForm.track}
                onValueChange={(v) =>
                  setEditForm((f) => ({ ...f, track: v as "main" | "workshop" }))
                }
              >
                <SelectTrigger id="edit-track" className="bg-jsconf-bg border-jsconf-border rounded-none h-10 font-sans text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-jsconf-surface border-jsconf-border rounded-none">
                  <SelectItem value="main">Main</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingSession(null)}
              className="rounded-none border-jsconf-border text-jsconf-muted hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSession}
              className="rounded-none bg-jsconf-yellow text-black font-display font-bold uppercase tracking-wide hover:bg-jsconf-yellow/90"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelConfirm} onOpenChange={() => setCancelConfirm(null)}>
        <DialogContent className="bg-jsconf-surface border-jsconf-border rounded-none">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-white uppercase tracking-wide">
              Cancel Session
            </DialogTitle>
            <DialogDescription className="sr-only">
              Confirm cancellation of this session
            </DialogDescription>
          </DialogHeader>
          <p className="font-sans text-sm text-jsconf-muted">
            Are you sure you want to cancel this session? This action will mark it as
            cancelled for all attendees.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelConfirm(null)}
              className="rounded-none border-jsconf-border text-jsconf-muted hover:text-white"
            >
              No, Keep It
            </Button>
            <Button
              variant="outline"
              onClick={() => cancelConfirm && handleCancelSession(cancelConfirm)}
              className="rounded-none border-jsconf-red text-jsconf-red hover:bg-jsconf-red/10"
            >
              Yes, Cancel Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
