"use client"

import { useMemo, useState } from "react"
import { Radio, CalendarDays } from "lucide-react"
import type {
  ConferenceRow,
  ConferenceDayRow,
  ConferenceSlotRow,
  ConferenceStreamRow,
} from "@/lib/db"
import type { SlotType } from "@/lib/billing"
import { StreamPlayer } from "./stream-player"

const SLOT_TYPE_LABELS: Record<string, string> = {
  keynote: "Keynote",
  talk: "Talk",
  workshop: "Workshop",
  lightning: "Lightning",
  panel: "Panel",
  break: "Break",
}

const SLOT_TYPE_BORDER: Record<SlotType, string> = {
  keynote: "border-l-jsconf-yellow",
  talk: "border-l-blue-400",
  workshop: "border-l-emerald-400",
  lightning: "border-l-orange-400",
  panel: "border-l-pink-400",
  break: "border-l-jsconf-border",
}

interface PublicConferenceViewProps {
  conference: ConferenceRow
  days: ConferenceDayRow[]
  slots: ConferenceSlotRow[]
  streams: ConferenceStreamRow[]
}

export function PublicConferenceView({
  conference,
  days,
  slots,
  streams,
}: PublicConferenceViewProps) {
  const sortedStreams = useMemo(
    () => [...streams].sort((a, b) => a.sort_order - b.sort_order),
    [streams],
  )
  // Default to the featured stream, else the first one.
  const defaultStreamId =
    sortedStreams.find((s) => s.is_featured)?.id ?? sortedStreams[0]?.id ?? null
  const [activeStreamId, setActiveStreamId] = useState<string | null>(defaultStreamId)
  const activeStream = sortedStreams.find((s) => s.id === activeStreamId) ?? sortedStreams[0] ?? null

  const sortedDays = useMemo(
    () => [...days].sort((a, b) => a.sort_order - b.sort_order),
    [days],
  )
  const [activeDayId, setActiveDayId] = useState<string | null>(sortedDays[0]?.id ?? null)
  const activeDay = sortedDays.find((d) => d.id === activeDayId) ?? sortedDays[0] ?? null

  const daySlots = useMemo(() => {
    if (!activeDay) return []
    return slots
      .filter((s) => s.day_id === activeDay.id)
      .sort((a, b) => a.sort_order - b.sort_order)
  }, [slots, activeDay])

  return (
    <main className="min-h-screen bg-jsconf-bg text-foreground">
      {/* Header */}
      <header className="border-b border-jsconf-border">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-jsconf-muted mb-2">
            <Radio className="h-3 w-3 text-jsconf-yellow" />
            Live
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl uppercase tracking-wide text-balance">
            {conference.name}
          </h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-10">
        {/* Stream */}
        <section>
          {activeStream ? (
            <>
              <StreamPlayer embedUrl={activeStream.embed_url} title={activeStream.label} />
              <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-display font-bold text-lg text-foreground">
                    {activeStream.label}
                  </h2>
                  {activeStream.track && (
                    <span className="font-mono text-[11px] uppercase tracking-wider text-jsconf-muted">
                      {activeStream.track}
                    </span>
                  )}
                </div>
              </div>

              {/* Track / stream switcher */}
              {sortedStreams.length > 1 && (
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  {sortedStreams.map((stream) => (
                    <button
                      key={stream.id}
                      onClick={() => setActiveStreamId(stream.id)}
                      className={`px-3 py-2 font-mono text-xs uppercase tracking-wider border transition-colors ${
                        activeStream.id === stream.id
                          ? "bg-jsconf-yellow text-primary-foreground border-jsconf-yellow font-bold"
                          : "border-jsconf-border text-jsconf-muted hover:text-foreground hover:border-foreground"
                      }`}
                    >
                      {stream.track || stream.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <StreamPlayer embedUrl={null} />
          )}
        </section>

        {/* Schedule */}
        {sortedDays.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="h-4 w-4 text-jsconf-muted" />
              <h2 className="font-mono text-xs text-jsconf-muted uppercase tracking-widest">
                Schedule
              </h2>
            </div>

            {/* Day tabs */}
            {sortedDays.length > 1 && (
              <div className="flex items-center gap-2 flex-wrap border-b border-jsconf-border mb-5 pb-3">
                {sortedDays.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => setActiveDayId(day.id)}
                    className={`px-3 py-2 font-mono text-xs uppercase tracking-wider border transition-colors ${
                      activeDay?.id === day.id
                        ? "bg-jsconf-yellow text-primary-foreground border-jsconf-yellow font-bold"
                        : "border-jsconf-border text-jsconf-muted hover:text-foreground hover:border-foreground"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            )}

            {daySlots.length === 0 ? (
              <p className="font-mono text-sm text-jsconf-muted">No sessions scheduled.</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {daySlots.map((slot) => {
                  const type = (slot.type as SlotType) ?? "talk"
                  return (
                    <li
                      key={slot.id}
                      className={`bg-jsconf-surface border border-jsconf-border border-l-4 ${
                        SLOT_TYPE_BORDER[type] ?? "border-l-jsconf-border"
                      } p-4 flex items-center gap-4`}
                    >
                      <div className="w-16 shrink-0 text-center">
                        <div className="font-mono text-sm text-foreground">
                          {slot.start_time ? slot.start_time.slice(0, 5) : "--:--"}
                        </div>
                        <div className="font-mono text-[10px] text-jsconf-muted">
                          {slot.duration}m
                        </div>
                      </div>
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
                        <h3 className="font-display font-bold text-foreground text-sm">
                          {slot.title}
                        </h3>
                        {slot.description && (
                          <p className="font-sans text-sm text-jsconf-muted mt-1 leading-relaxed">
                            {slot.description}
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        )}

        <footer className="border-t border-jsconf-border pt-6 pb-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-jsconf-muted">
            Powered by Evoca
          </p>
        </footer>
      </div>
    </main>
  )
}
