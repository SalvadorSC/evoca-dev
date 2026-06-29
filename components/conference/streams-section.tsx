"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Pencil, Star, Loader2, Tv, X } from "lucide-react"
import type { ConferenceStreamRow } from "@/lib/db"
import {
  upsertStream,
  deleteStream,
  setFeaturedStream,
  type StreamInput,
} from "@/app/dashboard/conference/actions"
import { StreamPlayer } from "./stream-player"

interface StreamsSectionProps {
  conferenceId: string
  initialStreams: ConferenceStreamRow[]
  /** Distinct track names from the schedule, offered as autocomplete. */
  tracks: string[]
}

export function StreamsSection({ conferenceId, initialStreams, tracks }: StreamsSectionProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ConferenceStreamRow | null>(null)

  const streams = [...initialStreams].sort((a, b) => a.sort_order - b.sort_order)

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      try {
        await fn()
        router.refresh()
      } catch (e) {
        window.alert(e instanceof Error ? e.message : "Action failed.")
      }
    })
  }

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(stream: ConferenceStreamRow) {
    setEditing(stream)
    setFormOpen(true)
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tv className="h-4 w-4 text-jsconf-muted" />
          <h2 className="font-mono text-xs text-jsconf-muted uppercase tracking-widest">
            Live streams
          </h2>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-3 py-2 bg-jsconf-yellow text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-jsconf-yellow/90 transition-all duration-150"
        >
          <Plus className="h-3.5 w-3.5" />
          Add stream
        </button>
      </div>

      <p className="font-mono text-[11px] text-jsconf-muted mb-4 leading-relaxed">
        Paste a Dailymotion video URL or id per track. Mark one as featured — it is the main feed
        shown first on your public page.
      </p>

      {streams.length === 0 ? (
        <div className="border border-dashed border-jsconf-border bg-jsconf-surface p-8 flex flex-col items-center text-center">
          <Tv className="h-5 w-5 text-jsconf-muted mb-2" />
          <p className="font-mono text-sm text-jsconf-muted">No streams added yet.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {streams.map((stream) => (
            <li
              key={stream.id}
              className="bg-jsconf-surface border border-jsconf-border overflow-hidden flex flex-col"
            >
              <StreamPlayer embedUrl={stream.embed_url} title={stream.label} />
              <div className="p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {stream.is_featured && (
                      <Star className="h-3 w-3 fill-jsconf-yellow text-jsconf-yellow shrink-0" />
                    )}
                    <h3 className="font-display font-bold text-foreground text-sm truncate">
                      {stream.label}
                    </h3>
                  </div>
                  {stream.track && (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-jsconf-muted">
                      {stream.track}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => run(() => setFeaturedStream(conferenceId, stream.id))}
                    disabled={pending || stream.is_featured}
                    className="p-1.5 text-jsconf-muted hover:text-jsconf-yellow transition-colors disabled:opacity-40"
                    aria-label="Set as featured"
                    title={stream.is_featured ? "Featured" : "Set as featured"}
                  >
                    <Star className={`h-4 w-4 ${stream.is_featured ? "fill-jsconf-yellow text-jsconf-yellow" : ""}`} />
                  </button>
                  <button
                    onClick={() => openEdit(stream)}
                    className="p-1.5 text-jsconf-muted hover:text-foreground transition-colors"
                    aria-label="Edit stream"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete the "${stream.label}" stream?`)) {
                        run(() => deleteStream(conferenceId, stream.id))
                      }
                    }}
                    className="p-1.5 text-jsconf-muted hover:text-red-400 transition-colors"
                    aria-label="Delete stream"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pending && (
        <div className="flex items-center gap-2 mt-3 font-mono text-xs text-jsconf-muted">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving…
        </div>
      )}

      {formOpen && (
        <StreamForm
          conferenceId={conferenceId}
          stream={editing}
          tracks={tracks}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false)
            router.refresh()
          }}
        />
      )}
    </section>
  )
}

// ─── Add / edit form (modal) ────────────────────────────────────────────────────

function StreamForm({
  conferenceId,
  stream,
  tracks,
  onClose,
  onSaved,
}: {
  conferenceId: string
  stream: ConferenceStreamRow | null
  tracks: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const [label, setLabel] = useState(stream?.label ?? "")
  const [track, setTrack] = useState(stream?.track ?? "")
  // Pre-fill with the existing video id (cleaner than the full embed URL).
  const [source, setSource] = useState(stream?.video_id ?? "")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit() {
    setError(null)
    const input: StreamInput = { label, track: track || null, source }
    startTransition(async () => {
      try {
        await upsertStream(conferenceId, input, stream?.id)
        onSaved()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save stream.")
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md bg-jsconf-surface border border-jsconf-border">
        <div className="flex items-center justify-between border-b border-jsconf-border p-4">
          <h3 className="font-display font-bold text-foreground uppercase tracking-wide text-sm">
            {stream ? "Edit stream" : "Add stream"}
          </h3>
          <button onClick={onClose} className="text-jsconf-muted hover:text-foreground transition-colors" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] text-jsconf-muted uppercase tracking-wider">Label</span>
            <input
              value={label}
              autoFocus
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Main stage"
              className="bg-jsconf-bg border border-jsconf-border px-3 py-2 font-sans text-sm text-foreground placeholder:text-jsconf-muted focus:outline-none focus:border-jsconf-yellow"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] text-jsconf-muted uppercase tracking-wider">Track (optional)</span>
            <input
              value={track}
              list="conference-tracks"
              onChange={(e) => setTrack(e.target.value)}
              placeholder="Track A"
              className="bg-jsconf-bg border border-jsconf-border px-3 py-2 font-sans text-sm text-foreground placeholder:text-jsconf-muted focus:outline-none focus:border-jsconf-yellow"
            />
            <datalist id="conference-tracks">
              {tracks.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] text-jsconf-muted uppercase tracking-wider">
              Dailymotion URL or video id
            </span>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="dailymotion.com/video/x8abc12"
              className="bg-jsconf-bg border border-jsconf-border px-3 py-2 font-mono text-xs text-foreground placeholder:text-jsconf-muted focus:outline-none focus:border-jsconf-yellow"
            />
          </label>

          {error && <p className="font-mono text-xs text-red-400">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-jsconf-border p-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-jsconf-border font-mono text-xs uppercase tracking-wider text-jsconf-muted hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-jsconf-yellow text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider hover:bg-jsconf-yellow/90 transition-all duration-150 disabled:opacity-60"
          >
            {pending && <Loader2 className="h-3 w-3 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
