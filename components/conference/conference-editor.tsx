"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  ChevronUp,
  ChevronDown,
  Clock,
  Loader2,
  CalendarDays,
  UserPlus,
  Megaphone,
} from "lucide-react"
import type { SlotType } from "@/lib/billing"
import { MAX_CONFERENCE_DAYS, slotAcceptsSpeaker } from "@/lib/billing"
import type {
  ConferenceRow,
  ConferenceDayRow,
  ConferenceSlotRow,
  ConferenceStreamRow,
} from "@/lib/db"
import {
  addDay,
  addSlot,
  deleteConference,
  deleteDay,
  deleteSlot,
  moveSlot,
  renameConference,
  renameDay,
  setDayDate,
  updateSlot,
  type SlotInput,
} from "@/app/dashboard/conference/actions"
import { SlotDialog, SLOT_TYPE_LABELS } from "./slot-dialog"
import { AssignSpeakerDialog } from "./assign-speaker-dialog"
import { StreamsSection } from "./streams-section"
import { PublishBar } from "./publish-bar"

export interface SlotAssignment {
  email: string
  status: string
}

interface ConferenceEditorProps {
  conference: ConferenceRow
  initialDays: ConferenceDayRow[]
  initialSlots: ConferenceSlotRow[]
  initialStreams: ConferenceStreamRow[]
  accessLevel: "none" | "prep" | "live"
  eventStart: string | null
  eventEnd: string | null
  assignmentsBySlot?: Record<string, SlotAssignment>
}

const SLOT_TYPE_STYLES: Record<SlotType, string> = {
  keynote: "border-l-jsconf-yellow",
  talk: "border-l-blue-400",
  workshop: "border-l-emerald-400",
  lightning: "border-l-orange-400",
  panel: "border-l-pink-400",
  break: "border-l-jsconf-border",
}

export function ConferenceEditor({
  conference,
  initialDays,
  initialSlots,
  initialStreams,
  accessLevel,
  eventStart,
  eventEnd,
  assignmentsBySlot = {},
}: ConferenceEditorProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const days = useMemo(
    () => [...initialDays].sort((a, b) => a.sort_order - b.sort_order),
    [initialDays],
  )
  const [activeDayId, setActiveDayId] = useState<string | null>(days[0]?.id ?? null)
  const activeDay = days.find((d) => d.id === activeDayId) ?? days[0] ?? null

  const slotsByDay = useMemo(() => {
    const map: Record<string, ConferenceSlotRow[]> = {}
    for (const s of initialSlots) {
      if (!map[s.day_id]) map[s.day_id] = []
      map[s.day_id].push(s)
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.sort_order - b.sort_order)
    }
    return map
  }, [initialSlots])

  const activeSlots = activeDay ? slotsByDay[activeDay.id] ?? [] : []

  // Distinct track names across the whole schedule, for stream autocomplete.
  const tracks = useMemo(() => {
    const set = new Set<string>()
    for (const s of initialSlots) {
      if (s.track?.trim()) set.add(s.track.trim())
    }
    return [...set].sort()
  }, [initialSlots])

  // Dialog state
  const [slotDialogOpen, setSlotDialogOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<ConferenceSlotRow | null>(null)
  const [assignSlot, setAssignSlot] = useState<ConferenceSlotRow | null>(null)

  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(conference.name)

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      try {
        await fn()
        router.refresh()
      } catch (e) {
        // Surface a minimal alert; inline errors handled within dialogs.
        console.log("[v0] conference action error:", e instanceof Error ? e.message : e)
        window.alert(e instanceof Error ? e.message : "Action failed.")
      }
    })
  }

  function openAddSlot() {
    setEditingSlot(null)
    setSlotDialogOpen(true)
  }

  function openEditSlot(slot: ConferenceSlotRow) {
    setEditingSlot(slot)
    setSlotDialogOpen(true)
  }

  async function handleSlotSubmit(input: SlotInput) {
    if (!activeDay) return
    if (editingSlot) {
      await updateSlot(conference.id, editingSlot.id, input)
    } else {
      await addSlot(conference.id, activeDay.id, input)
    }
    router.refresh()
  }

  function reorder(slot: ConferenceSlotRow, dir: -1 | 1) {
    const list = activeSlots
    const idx = list.findIndex((s) => s.id === slot.id)
    const swapWith = list[idx + dir]
    if (!swapWith) return
    run(async () => {
      await moveSlot(conference.id, slot.id, { sort_order: swapWith.sort_order })
      await moveSlot(conference.id, swapWith.id, { sort_order: slot.sort_order })
    })
  }

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* Breadcrumb / header */}
      <Link
        href="/dashboard/conference"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-jsconf-muted hover:text-foreground uppercase tracking-wider mb-5"
      >
        <ArrowLeft className="h-3 w-3" />
        All conferences
      </Link>

      <div className="flex items-start justify-between gap-4 mb-2">
        {editingName ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              value={nameDraft}
              autoFocus
              onChange={(e) => setNameDraft(e.target.value)}
              className="flex-1 bg-jsconf-bg border border-jsconf-border px-3 py-2 font-display font-bold text-xl text-foreground focus:outline-none focus:border-jsconf-yellow"
            />
            <button
              onClick={() =>
                run(async () => {
                  await renameConference(conference.id, nameDraft)
                  setEditingName(false)
                })
              }
              className="px-3 py-2 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase hover:opacity-90 transition-all duration-150"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="font-display font-bold text-2xl text-foreground uppercase tracking-wide truncate">
              {conference.name}
            </h1>
            <button
              onClick={() => {
                setNameDraft(conference.name)
                setEditingName(true)
              }}
              className="text-jsconf-muted hover:text-foreground transition-colors shrink-0"
              aria-label="Rename conference"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/dashboard/conference/${conference.id}/cfp`}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-jsconf-border font-mono text-xs uppercase tracking-wider text-foreground hover:border-jsconf-yellow transition-colors"
          >
            <Megaphone className="h-3 w-3" />
            Call for Papers
          </Link>
          <button
            onClick={() => {
              if (window.confirm("Delete this conference and its entire schedule?")) {
                run(async () => {
                  await deleteConference(conference.id)
                  router.push("/dashboard/conference")
                })
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-jsconf-border font-mono text-xs uppercase tracking-wider text-jsconf-muted hover:text-red-400 hover:border-red-400 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      </div>

      {accessLevel === "prep" && (
        <p className="font-mono text-xs text-jsconf-muted mb-6">
          Prep mode — you can build the schedule now. Live presenting unlocks during your event window.
        </p>
      )}

      {/* Publish / public page controls */}
      <div className="mt-4">
        <PublishBar
          conferenceId={conference.id}
          initialIsPublic={conference.is_public}
          initialSlug={conference.slug}
        />
      </div>

      {/* Day tabs */}
      <div className="flex items-center gap-2 flex-wrap border-b border-jsconf-border mb-6 pb-3 mt-4">
        {days.map((day) => (
          <button
            key={day.id}
            onClick={() => setActiveDayId(day.id)}
            className={`px-3 py-2 font-mono text-xs uppercase tracking-wider border transition-colors ${
              activeDay?.id === day.id
                ? "bg-jsconf-yellow text-black border-jsconf-yellow font-bold"
                : "border-jsconf-border text-jsconf-muted hover:text-foreground hover:border-white"
            }`}
          >
            {day.label}
          </button>
        ))}
        {days.length < MAX_CONFERENCE_DAYS && (
          <button
            onClick={() => run(() => addDay(conference.id))}
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-dashed border-jsconf-border font-mono text-xs uppercase tracking-wider text-jsconf-muted hover:text-foreground hover:border-white transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add day
          </button>
        )}
      </div>

      {activeDay && (
        <DayPanel
          key={activeDay.id}
          day={activeDay}
          dayCount={days.length}
          onRename={(label) => run(() => renameDay(conference.id, activeDay.id, label))}
          onSetDate={(date) => run(() => setDayDate(conference.id, activeDay.id, date))}
          onDelete={() =>
            run(async () => {
              await deleteDay(conference.id, activeDay.id)
              setActiveDayId(days.find((d) => d.id !== activeDay.id)?.id ?? null)
            })
          }
          eventStart={eventStart}
          eventEnd={eventEnd}
        />
      )}

      {/* Slots timeline */}
      <div className="flex items-center justify-between mt-6 mb-3">
        <h2 className="font-mono text-xs text-jsconf-muted uppercase tracking-widest">Timeline</h2>
        <button
          onClick={openAddSlot}
          disabled={!activeDay}
          className="inline-flex items-center gap-2 px-3 py-2 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-jsconf-yellow/90 transition-all duration-150 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add slot
        </button>
      </div>

      {activeSlots.length === 0 ? (
        <button
          onClick={openAddSlot}
          className="w-full border border-dashed border-jsconf-border bg-jsconf-surface p-12 flex flex-col items-center justify-center text-center hover:border-jsconf-yellow/50 transition-colors"
        >
          <Clock className="h-5 w-5 text-jsconf-muted mb-3" />
          <p className="font-mono text-sm text-jsconf-muted">
            No slots yet. Click to add the first one.
          </p>
        </button>
      ) : (
        <ol className="flex flex-col gap-2">
          {activeSlots.map((slot, idx) => {
            const type = (slot.type as SlotType) ?? "talk"
            const assignment = assignmentsBySlot[slot.id]
            return (
              <li
                key={slot.id}
                className={`bg-jsconf-surface border border-jsconf-border border-l-4 ${
                  SLOT_TYPE_STYLES[type] ?? "border-l-jsconf-border"
                } p-4 flex items-center gap-4`}
              >
                {/* time */}
                <div className="w-16 shrink-0 text-center">
                  <div className="font-mono text-sm text-foreground">
                    {slot.start_time ? slot.start_time.slice(0, 5) : "--:--"}
                  </div>
                  <div className="font-mono text-[10px] text-jsconf-muted">{slot.duration}m</div>
                </div>

                {/* body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-jsconf-muted">
                      {SLOT_TYPE_LABELS[type] ?? type}
                    </span>
                    {slot.track && (
                      <span className="font-mono text-[10px] uppercase tracking-wider text-jsconf-muted opacity-70">
                        · {slot.track}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-foreground text-sm truncate">{slot.title}</h3>
                  {slotAcceptsSpeaker(type) && (
                    <div className="mt-1">
                      {assignment ? (
                        <span className="font-mono text-[11px] text-jsconf-muted">
                          {assignment.email}{" "}
                          <span
                            className={
                              assignment.status === "accepted"
                                ? "text-emerald-400"
                                : assignment.status === "pending"
                                  ? "text-jsconf-yellow"
                                  : "text-jsconf-muted"
                            }
                          >
                            ({assignment.status})
                          </span>
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-jsconf-muted opacity-60">
                          No speaker assigned
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {slotAcceptsSpeaker(type) && (
                    <button
                      onClick={() => setAssignSlot(slot)}
                      className="p-2 text-jsconf-muted hover:text-jsconf-yellow transition-colors"
                      aria-label="Assign speaker"
                      title="Assign speaker"
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                  )}
                  <div className="flex flex-col">
                    <button
                      onClick={() => reorder(slot, -1)}
                      disabled={idx === 0 || pending}
                      className="text-jsconf-muted hover:text-foreground disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => reorder(slot, 1)}
                      disabled={idx === activeSlots.length - 1 || pending}
                      className="text-jsconf-muted hover:text-foreground disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => openEditSlot(slot)}
                    className="p-2 text-jsconf-muted hover:text-foreground transition-colors"
                    aria-label="Edit slot"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Delete this slot?")) {
                        run(() => deleteSlot(conference.id, slot.id))
                      }
                    }}
                    className="p-2 text-jsconf-muted hover:text-red-400 transition-colors"
                    aria-label="Delete slot"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {pending && (
        <div className="flex items-center gap-2 mt-4 font-mono text-xs text-jsconf-muted">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving…
        </div>
      )}

      {/* Live streams + public page */}
      <StreamsSection
        conferenceId={conference.id}
        initialStreams={initialStreams}
        tracks={tracks}
      />

      <SlotDialog
        open={slotDialogOpen}
        onOpenChange={setSlotDialogOpen}
        slot={editingSlot}
        onSubmit={handleSlotSubmit}
      />

      <AssignSpeakerDialog
        open={assignSlot !== null}
        onOpenChange={(o) => !o && setAssignSlot(null)}
        conferenceId={conference.id}
        slot={assignSlot}
        currentAssignment={assignSlot ? assignmentsBySlot[assignSlot.id] ?? null : null}
        onDone={() => {
          setAssignSlot(null)
          router.refresh()
        }}
      />
    </div>
  )
}

// ─── Day panel (rename, date, delete) ─────────────────────────────────────────

function DayPanel({
  day,
  dayCount,
  onRename,
  onSetDate,
  onDelete,
  eventStart,
  eventEnd,
}: {
  day: ConferenceDayRow
  dayCount: number
  onRename: (label: string) => void
  onSetDate: (date: string | null) => void
  onDelete: () => void
  eventStart: string | null
  eventEnd: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(day.label)

  const min = eventStart ? eventStart.slice(0, 10) : undefined
  const max = eventEnd ? eventEnd.slice(0, 10) : undefined

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-jsconf-surface border border-jsconf-border p-4">
      {editing ? (
        <div className="flex items-center gap-2 flex-1">
          <input
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1 bg-jsconf-bg border border-jsconf-border px-3 py-2 font-sans text-sm text-foreground focus:outline-none focus:border-jsconf-yellow"
          />
          <button
            onClick={() => {
              onRename(draft)
              setEditing(false)
            }}
            className="px-3 py-2 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase hover:opacity-90 transition-all duration-150"
          >
            Save
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-display font-bold text-foreground text-base">{day.label}</span>
          <button
            onClick={() => {
              setDraft(day.label)
              setEditing(true)
            }}
            className="text-jsconf-muted hover:text-foreground transition-colors"
            aria-label="Rename day"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-jsconf-muted" />
        <input
          type="date"
          value={day.date ? day.date.slice(0, 10) : ""}
          min={min}
          max={max}
          onChange={(e) => onSetDate(e.target.value || null)}
          className="bg-jsconf-bg border border-jsconf-border px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:border-jsconf-yellow"
        />
      </div>

      {dayCount > 1 && (
        <button
          onClick={() => {
            if (window.confirm(`Delete "${day.label}" and all its slots?`)) onDelete()
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-jsconf-border font-mono text-xs uppercase tracking-wider text-jsconf-muted hover:text-red-400 hover:border-red-400 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove day
        </button>
      )}
    </div>
  )
}
