"use client"

import { useEffect, useState } from "react"
import { Loader2, UserPlus, UserMinus, Mail, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { ConferenceSlotRow } from "@/lib/db"
import type { SlotAssignment } from "./conference-editor"

interface AssignSpeakerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conferenceId: string
  slot: ConferenceSlotRow | null
  currentAssignment: SlotAssignment | null
  onDone: () => void
}

export function AssignSpeakerDialog({
  open,
  onOpenChange,
  conferenceId,
  slot,
  currentAssignment,
  onDone,
}: AssignSpeakerDialogProps) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setEmail(currentAssignment?.email ?? "")
      setError(null)
      setSuccess(null)
      setBusy(false)
    }
  }, [open, currentAssignment])

  async function call(action: "assign" | "unassign") {
    if (!slot) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/conference/assign-speaker", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          conferenceId,
          slotId: slot.id,
          email: action === "assign" ? email.trim() : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.")
        setBusy(false)
        return
      }
      if (action === "assign") {
        setSuccess(
          data.hasAccount
            ? "Speaker assigned. They now have event-scoped Pro access."
            : "Invitation recorded. They'll be linked automatically when they sign up.",
        )
        // Brief pause so the user sees the confirmation, then close.
        setTimeout(onDone, 900)
      } else {
        onDone()
      }
    } catch {
      setError("Network error. Please try again.")
      setBusy(false)
    }
  }

  const inputCls =
    "w-full bg-jsconf-bg border border-jsconf-border px-3 py-2.5 font-sans text-sm text-white placeholder:text-jsconf-muted focus:outline-none focus:border-jsconf-yellow"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-jsconf-surface border-jsconf-border text-white">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">Assign Speaker</DialogTitle>
        </DialogHeader>

        {slot && (
          <p className="font-mono text-xs text-jsconf-muted -mt-1 mb-1">
            {slot.title}
          </p>
        )}

        {currentAssignment && (
          <div className="flex items-center justify-between gap-3 bg-jsconf-bg border border-jsconf-border px-3 py-2.5">
            <div className="min-w-0">
              <p className="font-sans text-sm text-white truncate">{currentAssignment.email}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-jsconf-muted">
                Status: {currentAssignment.status}
              </p>
            </div>
            <button
              onClick={() => call("unassign")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-jsconf-border font-mono text-xs uppercase tracking-wider text-jsconf-muted hover:text-red-400 hover:border-red-400 transition-colors disabled:opacity-60 shrink-0"
            >
              <UserMinus className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        )}

        <div className="py-2">
          <label htmlFor="speaker-email" className="font-mono text-xs text-jsconf-muted uppercase tracking-wider block mb-2">
            {currentAssignment ? "Replace with" : "Speaker email"}
          </label>
          <div className="relative">
            <Mail className="h-4 w-4 text-jsconf-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="speaker-email"
              type="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") call("assign")
              }}
              placeholder="speaker@example.com"
              className={`${inputCls} pl-9`}
            />
          </div>
          <p className="font-mono text-[11px] text-jsconf-muted mt-2 leading-relaxed">
            If they already have an account, access is granted instantly. Otherwise we record the
            invite and link it when they sign up with this email.
          </p>
          {error && <p className="font-mono text-xs text-red-400 mt-2">{error}</p>}
          {success && (
            <p className="font-mono text-xs text-emerald-400 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {success}
            </p>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={() => call("assign")}
            disabled={busy || !email.trim()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-jsconf-yellow/90 transition-all duration-150 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {currentAssignment ? "Reassign" : "Assign"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
