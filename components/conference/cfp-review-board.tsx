"use client"

import { useMemo, useState, useTransition } from "react"
import { Star, Check, X, Clock, ChevronDown, Loader2, Mail } from "lucide-react"
import {
  decideCfpSubmission,
  setCfpReview,
} from "@/app/dashboard/conference/cfp-actions"
import type { CfpStatus } from "@/lib/cfp"

export interface ReviewSubmission {
  id: string
  name: string
  email: string
  title: string
  abstract: string
  talkFormat: string
  bio: string | null
  status: CfpStatus
  rating: number | null
  reviewerNotes: string | null
  answers: { questionId: string; answer: unknown }[]
}

type Filter = "all" | CfpStatus

const STATUS_META: Record<CfpStatus, { label: string; cls: string }> = {
  submitted: { label: "New", cls: "bg-jsconf-blue/15 text-jsconf-blue border-jsconf-blue/40" },
  under_review: { label: "Reviewing", cls: "bg-jsconf-yellow-dim text-jsconf-yellow border-jsconf-yellow/40" },
  accepted: { label: "Accepted", cls: "bg-green-500/15 text-green-400 border-green-500/40" },
  rejected: { label: "Rejected", cls: "bg-jsconf-red/15 text-jsconf-red border-jsconf-red/40" },
  waitlisted: { label: "Waitlisted", cls: "bg-jsconf-orange/15 text-jsconf-orange border-jsconf-orange/40" },
}

const FILTERS: Filter[] = ["all", "submitted", "accepted", "waitlisted", "rejected"]

function answerToText(answer: unknown): string {
  if (answer == null) return "—"
  if (Array.isArray(answer)) return answer.join(", ")
  if (typeof answer === "boolean") return answer ? "Yes" : "No"
  return String(answer)
}

export function CfpReviewBoard({
  conferenceId,
  submissions: initial,
  questionLabels,
}: {
  conferenceId: string
  submissions: ReviewSubmission[]
  questionLabels: Record<string, string>
}) {
  const [submissions, setSubmissions] = useState(initial)
  const [filter, setFilter] = useState<Filter>("all")
  const [expanded, setExpanded] = useState<string | null>(null)

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: submissions.length }
    for (const s of submissions) c[s.status] = (c[s.status] ?? 0) + 1
    return c
  }, [submissions])

  const visible = filter === "all" ? submissions : submissions.filter((s) => s.status === filter)

  function patchLocal(id: string, patch: Partial<ReviewSubmission>) {
    setSubmissions((subs) => subs.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  if (submissions.length === 0) {
    return (
      <div className="border border-jsconf-border bg-jsconf-surface p-10 text-center">
        <p className="font-mono text-sm text-jsconf-muted">
          No submissions yet. Share your public CFP link to start collecting proposals.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider border transition-colors ${
              filter === f
                ? "bg-jsconf-yellow text-black border-jsconf-yellow font-bold"
                : "border-jsconf-border text-jsconf-muted hover:text-foreground hover:border-white"
            }`}
          >
            {f === "all" ? "All" : STATUS_META[f].label} ({counts[f] ?? 0})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {visible.map((s) => (
          <SubmissionCard
            key={s.id}
            conferenceId={conferenceId}
            submission={s}
            questionLabels={questionLabels}
            expanded={expanded === s.id}
            onToggle={() => setExpanded((e) => (e === s.id ? null : s.id))}
            onPatch={(patch) => patchLocal(s.id, patch)}
          />
        ))}
        {visible.length === 0 && (
          <p className="font-mono text-xs text-jsconf-muted px-1">No submissions in this view.</p>
        )}
      </div>
    </div>
  )
}

function SubmissionCard({
  conferenceId,
  submission: s,
  questionLabels,
  expanded,
  onToggle,
  onPatch,
}: {
  conferenceId: string
  submission: ReviewSubmission
  questionLabels: Record<string, string>
  expanded: boolean
  onToggle: () => void
  onPatch: (patch: Partial<ReviewSubmission>) => void
}) {
  const [pending, startTransition] = useTransition()
  const [notes, setNotes] = useState(s.reviewerNotes ?? "")
  const [toast, setToast] = useState<string | null>(null)
  const meta = STATUS_META[s.status]

  function decide(decision: Extract<CfpStatus, "accepted" | "rejected" | "waitlisted">) {
    startTransition(async () => {
      const res = await decideCfpSubmission(conferenceId, s.id, decision)
      onPatch({ status: decision })
      setToast(res.emailSent ? "Decision saved · email sent" : "Decision saved · email skipped (no key)")
      setTimeout(() => setToast(null), 3000)
    })
  }

  function setRating(rating: number) {
    const next = s.rating === rating ? null : rating
    onPatch({ rating: next })
    startTransition(async () => {
      await setCfpReview(conferenceId, s.id, { rating: next })
    })
  }

  function saveNotes() {
    onPatch({ reviewerNotes: notes })
    startTransition(async () => {
      await setCfpReview(conferenceId, s.id, { reviewerNotes: notes })
    })
  }

  return (
    <div className="border border-jsconf-border bg-jsconf-surface">
      {/* Header row */}
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={onToggle}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide border ${meta.cls}`}>
              {meta.label}
            </span>
            <span className="font-mono text-[11px] text-jsconf-muted uppercase">{s.talkFormat}</span>
          </div>
          <h3 className="font-display font-bold text-foreground mt-1.5 truncate">{s.title}</h3>
          <p className="font-mono text-xs text-jsconf-muted truncate">
            {s.name} · {s.email}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`h-4 w-4 ${s.rating && n <= s.rating ? "fill-jsconf-yellow text-jsconf-yellow" : "text-jsconf-border"}`}
            />
          ))}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-jsconf-muted shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </div>

      {expanded && (
        <div className="border-t border-jsconf-border p-4 flex flex-col gap-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wide text-jsconf-muted mb-1">Abstract</p>
            <p className="font-mono text-sm text-foreground leading-relaxed whitespace-pre-wrap">{s.abstract}</p>
          </div>

          {s.bio && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wide text-jsconf-muted mb-1">Bio</p>
              <p className="font-mono text-sm text-jsconf-muted leading-relaxed whitespace-pre-wrap">{s.bio}</p>
            </div>
          )}

          {s.answers.length > 0 && (
            <div className="flex flex-col gap-3">
              {s.answers.map((a) => (
                <div key={a.questionId}>
                  <p className="font-mono text-[10px] uppercase tracking-wide text-jsconf-muted mb-1">
                    {questionLabels[a.questionId] ?? "Question"}
                  </p>
                  <p className="font-mono text-sm text-foreground">{answerToText(a.answer)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Rating */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wide text-jsconf-muted mb-1.5">Your rating</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} aria-label={`Rate ${n}`}>
                  <Star
                    className={`h-6 w-6 transition-colors ${s.rating && n <= s.rating ? "fill-jsconf-yellow text-jsconf-yellow" : "text-jsconf-border hover:text-jsconf-yellow"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wide text-jsconf-muted mb-1.5">Reviewer notes</p>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="Private notes (not shared with the speaker)."
              className="w-full bg-jsconf-bg border border-jsconf-border px-3 py-2 font-mono text-sm text-foreground placeholder:text-jsconf-muted focus:outline-none focus:border-jsconf-yellow"
            />
          </div>

          {/* Decisions */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              onClick={() => decide("accepted")}
              disabled={pending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-500/15 border border-green-500/40 text-green-400 font-mono text-xs uppercase tracking-wide hover:bg-green-500/25 transition-colors disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Accept
            </button>
            <button
              onClick={() => decide("waitlisted")}
              disabled={pending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-jsconf-orange/15 border border-jsconf-orange/40 text-jsconf-orange font-mono text-xs uppercase tracking-wide hover:bg-jsconf-orange/25 transition-colors disabled:opacity-50"
            >
              <Clock className="h-3.5 w-3.5" />
              Waitlist
            </button>
            <button
              onClick={() => decide("rejected")}
              disabled={pending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-jsconf-red/15 border border-jsconf-red/40 text-jsconf-red font-mono text-xs uppercase tracking-wide hover:bg-jsconf-red/25 transition-colors disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </button>
            {toast && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-jsconf-muted">
                <Mail className="h-3.5 w-3.5" />
                {toast}
              </span>
            )}
          </div>

          {s.status === "accepted" && (
            <p className="font-mono text-[11px] text-jsconf-muted">
              An unscheduled slot was created — drag it onto the timeline from the schedule editor.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
