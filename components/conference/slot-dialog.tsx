"use client"

import { useEffect, useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { SLOT_TYPES, type SlotType } from "@/lib/billing"
import type { ConferenceSlotRow } from "@/lib/db"
import type { SlotInput } from "@/app/dashboard/conference/actions"

const SLOT_TYPE_LABELS: Record<SlotType, string> = {
  talk: "Talk",
  keynote: "Keynote",
  workshop: "Workshop",
  lightning: "Lightning Talk",
  break: "Break",
  panel: "Panel",
}

interface SlotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Existing slot when editing; null when adding. */
  slot: ConferenceSlotRow | null
  /** Pre-filled start time when adding from a timeline click. */
  defaultStartTime?: string | null
  onSubmit: (input: SlotInput) => Promise<void>
}

export function SlotDialog({
  open,
  onOpenChange,
  slot,
  defaultStartTime,
  onSubmit,
}: SlotDialogProps) {
  const [title, setTitle] = useState("")
  const [type, setType] = useState<SlotType>("talk")
  const [startTime, setStartTime] = useState("")
  const [duration, setDuration] = useState(30)
  const [track, setTrack] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Sync form state when the dialog opens / target changes.
  useEffect(() => {
    if (!open) return
    setError(null)
    if (slot) {
      setTitle(slot.title)
      setType((SLOT_TYPES as readonly string[]).includes(slot.type) ? (slot.type as SlotType) : "talk")
      setStartTime(slot.start_time ? slot.start_time.slice(0, 5) : "")
      setDuration(slot.duration)
      setTrack(slot.track ?? "")
      setDescription(slot.description ?? "")
    } else {
      setTitle("")
      setType("talk")
      setStartTime(defaultStartTime ? defaultStartTime.slice(0, 5) : "")
      setDuration(30)
      setTrack("")
      setDescription("")
    }
  }, [open, slot, defaultStartTime])

  function handleSubmit() {
    if (!title.trim()) {
      setError("Title is required.")
      return
    }
    startTransition(async () => {
      try {
        await onSubmit({
          title: title.trim(),
          type,
          start_time: startTime ? `${startTime}:00` : null,
          duration,
          track: track.trim() || null,
          description: description.trim() || null,
        })
        onOpenChange(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save slot.")
      }
    })
  }

  const inputCls =
    "w-full bg-jsconf-bg border border-jsconf-border px-3 py-2.5 font-sans text-sm text-foreground placeholder:text-jsconf-muted focus:outline-none focus:border-jsconf-yellow"
  const labelCls = "font-mono text-xs text-jsconf-muted uppercase tracking-wider block mb-2"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-jsconf-surface border-jsconf-border text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">
            {slot ? "Edit Slot" : "Add Slot"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div>
            <label htmlFor="slot-title" className={labelCls}>
              Title
            </label>
            <input
              id="slot-title"
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setError(null)
              }}
              placeholder="e.g. Opening Keynote"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Type</label>
            <div className="flex flex-wrap gap-2">
              {SLOT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider border transition-colors ${
                    type === t
                      ? "bg-jsconf-yellow text-black border-jsconf-yellow font-bold"
                      : "border-jsconf-border text-jsconf-muted hover:text-foreground hover:border-white"
                  }`}
                >
                  {SLOT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="slot-start" className={labelCls}>
                Start time
              </label>
              <input
                id="slot-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="slot-duration" className={labelCls}>
                Duration (min)
              </label>
              <input
                id="slot-duration"
                type="number"
                min={5}
                max={600}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label htmlFor="slot-track" className={labelCls}>
              Track <span className="lowercase opacity-60">(optional)</span>
            </label>
            <input
              id="slot-track"
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              placeholder="e.g. Main Stage"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="slot-desc" className={labelCls}>
              Description <span className="lowercase opacity-60">(optional)</span>
            </label>
            <textarea
              id="slot-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          {error && <p className="font-mono text-xs text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <button
            onClick={handleSubmit}
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-jsconf-yellow/90 transition-all duration-150 disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {slot ? "Save changes" : "Add slot"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { SLOT_TYPE_LABELS }
