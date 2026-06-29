import { CalendarDays, Clock, Building2, User, Lock } from "lucide-react"
import {
  conferenceTalkStatus,
  isConferenceTalkReadOnly,
  type ConferenceTalkStatus,
} from "@/lib/billing"
import type { SpeakerConferenceTalk } from "@/lib/affiliations"

const STATUS_STYLES: Record<ConferenceTalkStatus, { label: string; className: string }> = {
  upcoming: { label: "Upcoming", className: "bg-jsconf-surface-2 text-jsconf-muted border-jsconf-border" },
  live: { label: "Live", className: "bg-jsconf-yellow text-black border-jsconf-yellow" },
  past: { label: "Past", className: "bg-jsconf-surface-2 text-jsconf-muted border-jsconf-border" },
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function formatTime(time: string | null): string | null {
  if (!time) return null
  // time is "HH:MM:SS" — trim to HH:MM
  return time.slice(0, 5)
}

export function ConferenceTalkCard({ talk }: { talk: SpeakerConferenceTalk }) {
  const status = conferenceTalkStatus(talk.eventStart, talk.eventEnd)
  const readOnly = isConferenceTalkReadOnly(talk.eventEnd)
  const statusStyle = STATUS_STYLES[status]
  const dayDate = formatDate(talk.dayDate)
  const slotTime = formatTime(talk.startTime)

  return (
    <div className="bg-jsconf-surface border border-jsconf-border p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h3 className="font-display font-bold text-foreground text-base truncate">{talk.title}</h3>
          <span
            className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${statusStyle.className}`}
          >
            {statusStyle.label}
          </span>
        </div>

        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <span className="font-mono text-xs text-jsconf-muted flex items-center gap-1.5">
            <Building2 className="h-3 w-3 shrink-0" />
            {talk.conferenceName}
          </span>
          <span className="font-mono text-xs text-jsconf-muted flex items-center gap-1.5">
            <User className="h-3 w-3 shrink-0" />
            {talk.organizerName}
          </span>
          {(dayDate || talk.dayLabel) && (
            <span className="font-mono text-xs text-jsconf-muted flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3 shrink-0" />
              {dayDate ?? talk.dayLabel}
            </span>
          )}
          {slotTime && (
            <span className="font-mono text-xs text-jsconf-muted flex items-center gap-1.5">
              <Clock className="h-3 w-3 shrink-0" />
              {slotTime}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center shrink-0">
        {readOnly ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-2 border border-jsconf-border font-mono text-xs uppercase tracking-wider text-jsconf-muted">
            <Lock className="h-3 w-3" />
            Read-only
          </span>
        ) : (
          <span className="font-mono text-[10px] text-jsconf-muted uppercase tracking-wider">
            Managed by organizer
          </span>
        )}
      </div>
    </div>
  )
}
