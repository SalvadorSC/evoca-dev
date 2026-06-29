"use client"

import { useState } from "react"
import type { CfpCustomQuestion } from "@/lib/cfp"
import { Check, Loader2 } from "lucide-react"

const TALK_FORMATS = [
  { value: "talk", label: "Talk (25–40 min)" },
  { value: "lightning", label: "Lightning talk (5–10 min)" },
  { value: "workshop", label: "Workshop (60+ min)" },
  { value: "panel", label: "Panel" },
]

const inputClass =
  "w-full bg-jsconf-bg border border-jsconf-border px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-jsconf-muted focus:outline-none focus:border-jsconf-yellow"
const labelClass = "block font-mono text-xs text-jsconf-muted mb-1.5 uppercase tracking-wide"

export function CfpSubmissionForm({
  slug,
  questions,
}: {
  slug: string
  questions: CfpCustomQuestion[]
}) {
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    abstract: "",
    talkFormat: "talk",
    bio: "",
    website: "", // honeypot
  })
  // Custom answers keyed by question id. Arrays for multi_select; bool for checkbox.
  const [answers, setAnswers] = useState<Record<string, unknown>>({})

  const setField = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const setAnswer = (id: string, v: unknown) => setAnswers((a) => ({ ...a, [id]: v }))

  function validate(): string | null {
    if (!form.name.trim()) return "Your name is required."
    if (!form.email.trim()) return "Your email is required."
    if (!form.title.trim()) return "A talk title is required."
    if (!form.abstract.trim()) return "An abstract is required."
    for (const q of questions) {
      if (!q.required) continue
      const a = answers[q.id]
      const empty =
        a == null ||
        (typeof a === "string" && a.trim() === "") ||
        (Array.isArray(a) && a.length === 0) ||
        (q.type === "checkbox" && a !== true)
      if (empty) return `"${q.label}" is required.`
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch("/api/cfp/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          ...form,
          answers: questions.map((q) => ({ questionId: q.id, value: answers[q.id] ?? null })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        return
      }
      setDone(true)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="border border-jsconf-yellow/30 bg-jsconf-yellow-dim p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-jsconf-yellow mb-4">
          <Check className="h-6 w-6 text-jsconf-bg" />
        </div>
        <h2 className="font-display font-bold text-xl text-foreground mb-2">Submission received</h2>
        <p className="font-mono text-sm text-jsconf-muted text-balance">
          Thanks, {form.name.split(" ")[0] || "there"}! We&apos;ve recorded your proposal. You&apos;ll
          hear from the organizers by email once it&apos;s been reviewed.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Honeypot — visually hidden, off-screen, not announced */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="cfp-website">Website</label>
        <input
          id="cfp-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => setField("website", e.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="cfp-name">Your name *</label>
          <input id="cfp-name" className={inputClass} value={form.name}
            onChange={(e) => setField("name", e.target.value)} placeholder="Ada Lovelace" />
        </div>
        <div>
          <label className={labelClass} htmlFor="cfp-email">Email *</label>
          <input id="cfp-email" type="email" className={inputClass} value={form.email}
            onChange={(e) => setField("email", e.target.value)} placeholder="ada@example.com" />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="cfp-title">Talk title *</label>
        <input id="cfp-title" className={inputClass} value={form.title}
          onChange={(e) => setField("title", e.target.value)} placeholder="Scaling realtime systems" />
      </div>

      <div>
        <label className={labelClass} htmlFor="cfp-format">Format</label>
        <select id="cfp-format" className={inputClass} value={form.talkFormat}
          onChange={(e) => setField("talkFormat", e.target.value)}>
          {TALK_FORMATS.map((f) => (
            <option key={f.value} value={f.value} className="bg-jsconf-bg">{f.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="cfp-abstract">Abstract *</label>
        <textarea id="cfp-abstract" rows={5} className={inputClass} value={form.abstract}
          onChange={(e) => setField("abstract", e.target.value)}
          placeholder="What will attendees learn? Describe your talk in a few sentences." />
      </div>

      <div>
        <label className={labelClass} htmlFor="cfp-bio">Speaker bio</label>
        <textarea id="cfp-bio" rows={3} className={inputClass} value={form.bio}
          onChange={(e) => setField("bio", e.target.value)}
          placeholder="A short bio the organizers can use to introduce you." />
      </div>

      {/* Organizer custom questions */}
      {questions.map((q) => (
        <CustomQuestionField key={q.id} q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
      ))}

      {error && (
        <p className="font-mono text-xs text-jsconf-red border border-jsconf-red/40 bg-jsconf-red/10 px-3 py-2">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting}
        className="inline-flex items-center justify-center gap-2 bg-jsconf-yellow text-jsconf-bg font-display font-bold uppercase tracking-wide py-3 px-6 hover:bg-jsconf-yellow/90 transition-colors disabled:opacity-60">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {submitting ? "Submitting..." : "Submit proposal"}
      </button>
    </form>
  )
}

function CustomQuestionField({
  q,
  value,
  onChange,
}: {
  q: CfpCustomQuestion
  value: unknown
  onChange: (v: unknown) => void
}) {
  const req = q.required ? " *" : ""

  if (q.type === "long_text") {
    return (
      <div>
        <label className={labelClass}>{q.label}{req}</label>
        <textarea rows={4} className={inputClass} value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)} />
      </div>
    )
  }

  if (q.type === "select") {
    return (
      <div>
        <label className={labelClass}>{q.label}{req}</label>
        <select className={inputClass} value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}>
          <option value="" className="bg-jsconf-bg">Select…</option>
          {(q.options ?? []).map((opt) => (
            <option key={opt} value={opt} className="bg-jsconf-bg">{opt}</option>
          ))}
        </select>
      </div>
    )
  }

  if (q.type === "multi_select") {
    const arr = Array.isArray(value) ? (value as string[]) : []
    return (
      <div>
        <label className={labelClass}>{q.label}{req}</label>
        <div className="flex flex-col gap-2">
          {(q.options ?? []).map((opt) => {
            const checked = arr.includes(opt)
            return (
              <label key={opt} className="flex items-center gap-2 font-mono text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={checked}
                  onChange={() => onChange(checked ? arr.filter((o) => o !== opt) : [...arr, opt])}
                  className="accent-jsconf-yellow" />
                {opt}
              </label>
            )
          })}
        </div>
      </div>
    )
  }

  if (q.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 font-mono text-sm text-foreground cursor-pointer">
        <input type="checkbox" checked={value === true}
          onChange={(e) => onChange(e.target.checked)} className="accent-jsconf-yellow" />
        {q.label}{req}
      </label>
    )
  }

  // short_text
  return (
    <div>
      <label className={labelClass}>{q.label}{req}</label>
      <input className={inputClass} value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
