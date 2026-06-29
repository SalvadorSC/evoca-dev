"use client"

import { useState, useTransition } from "react"
import { Check, Copy, Plus, Trash2, ExternalLink, Loader2 } from "lucide-react"
import {
  updateCfpSettings,
  addCfpQuestion,
  deleteCfpQuestion,
  type CfpSettingsInput,
  type QuestionInput,
} from "@/app/dashboard/conference/cfp-actions"
import type { CfpQuestionType } from "@/lib/cfp"

interface UiQuestion {
  id: string
  label: string
  type: CfpQuestionType
  options: string[] | null
  required: boolean
}

const QUESTION_TYPES: { value: CfpQuestionType; label: string }[] = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "select", label: "Dropdown (single)" },
  { value: "multi_select", label: "Checkboxes (multiple)" },
  { value: "checkbox", label: "Single checkbox" },
]

const inputClass =
  "w-full bg-jsconf-bg border border-jsconf-border px-3 py-2.5 font-mono text-sm text-white placeholder:text-jsconf-muted focus:outline-none focus:border-jsconf-yellow"
const labelClass = "block font-mono text-xs text-jsconf-muted mb-1.5 uppercase tracking-wide"

// datetime-local wants "YYYY-MM-DDTHH:mm"; DB returns ISO. Trim to minutes.
const toLocalInput = (iso: string | null) => (iso ? iso.slice(0, 16) : "")
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null)

export function CfpSettingsManager({
  conferenceId,
  slug,
  initialSettings,
  initialQuestions,
}: {
  conferenceId: string
  slug: string
  initialSettings: CfpSettingsInput
  initialQuestions: UiQuestion[]
}) {
  const [settings, setSettings] = useState<CfpSettingsInput>(initialSettings)
  const [questions, setQuestions] = useState<UiQuestion[]>(initialQuestions)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  const publicUrl =
    typeof window !== "undefined" ? `${window.location.origin}/cfp/${slug}` : `/cfp/${slug}`

  const set = <K extends keyof CfpSettingsInput>(k: K, v: CfpSettingsInput[K]) =>
    setSettings((s) => ({ ...s, [k]: v }))

  function saveSettings() {
    startTransition(async () => {
      await updateCfpSettings(conferenceId, settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  function copyLink() {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Share link */}
      <section className="border border-jsconf-border bg-jsconf-surface p-5">
        <h2 className={labelClass}>Public submission link</h2>
        <div className="flex items-center gap-2">
          <input readOnly value={publicUrl} className={`${inputClass} flex-1`} />
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-jsconf-border font-mono text-xs uppercase text-white hover:border-jsconf-yellow transition-colors shrink-0"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-jsconf-yellow" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2.5 border border-jsconf-border text-white hover:border-jsconf-yellow transition-colors shrink-0"
            aria-label="Open public page"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>

      {/* Settings */}
      <section className="border border-jsconf-border bg-jsconf-surface p-5 flex flex-col gap-5">
        <h2 className="font-display font-bold text-lg text-white">Settings</h2>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.isOpen}
            onChange={(e) => set("isOpen", e.target.checked)}
            className="accent-jsconf-yellow h-4 w-4"
          />
          <span className="font-mono text-sm text-white">
            Accept submissions {settings.isOpen ? "(open)" : "(closed)"}
          </span>
        </label>

        <div>
          <label className={labelClass} htmlFor="cfp-title">Page title</label>
          <input id="cfp-title" className={inputClass} value={settings.title}
            onChange={(e) => set("title", e.target.value)} />
        </div>

        <div>
          <label className={labelClass} htmlFor="cfp-desc">Description</label>
          <textarea id="cfp-desc" rows={3} className={inputClass} value={settings.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Tell speakers what you're looking for." />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="cfp-opens">Opens at</label>
            <input id="cfp-opens" type="datetime-local" className={inputClass}
              value={toLocalInput(settings.opensAt)}
              onChange={(e) => set("opensAt", fromLocalInput(e.target.value))} />
          </div>
          <div>
            <label className={labelClass} htmlFor="cfp-closes">Closes at</label>
            <input id="cfp-closes" type="datetime-local" className={inputClass}
              value={toLocalInput(settings.closesAt)}
              onChange={(e) => set("closesAt", fromLocalInput(e.target.value))} />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="cfp-cap">Max submissions per email</label>
          <input id="cfp-cap" type="number" min={1} max={20} className={`${inputClass} max-w-[140px]`}
            value={settings.maxSubmissionsPerEmail}
            onChange={(e) => set("maxSubmissionsPerEmail", parseInt(e.target.value, 10) || 1)} />
        </div>

        <div>
          <button onClick={saveSettings} disabled={pending}
            className="inline-flex items-center gap-2 bg-jsconf-yellow text-jsconf-bg font-display font-bold uppercase tracking-wide py-2.5 px-5 hover:bg-jsconf-yellow/90 transition-colors disabled:opacity-60">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
            {saved ? "Saved" : "Save settings"}
          </button>
        </div>
      </section>

      {/* Custom questions */}
      <section className="border border-jsconf-border bg-jsconf-surface p-5">
        <h2 className="font-display font-bold text-lg text-white mb-1">Custom questions</h2>
        <p className="font-mono text-xs text-jsconf-muted mb-4">
          Add your own questions on top of the standard name, email, title, abstract, and bio fields.
        </p>

        <div className="flex flex-col gap-2 mb-5">
          {questions.length === 0 && (
            <p className="font-mono text-xs text-jsconf-muted">No custom questions yet.</p>
          )}
          {questions.map((q) => (
            <div key={q.id} className="flex items-center justify-between gap-3 border border-jsconf-border bg-jsconf-bg px-3 py-2.5">
              <div className="min-w-0">
                <p className="font-mono text-sm text-white truncate">
                  {q.label} {q.required && <span className="text-jsconf-yellow">*</span>}
                </p>
                <p className="font-mono text-[11px] text-jsconf-muted">
                  {QUESTION_TYPES.find((t) => t.value === q.type)?.label}
                  {q.options?.length ? ` · ${q.options.join(", ")}` : ""}
                </p>
              </div>
              <button
                onClick={() =>
                  startTransition(async () => {
                    await deleteCfpQuestion(conferenceId, q.id)
                    setQuestions((qs) => qs.filter((x) => x.id !== q.id))
                  })
                }
                className="text-jsconf-muted hover:text-red-400 shrink-0"
                aria-label="Delete question"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <QuestionBuilder
          pending={pending}
          onAdd={(input) =>
            startTransition(async () => {
              await addCfpQuestion(conferenceId, input)
              // Optimistic temp id; server revalidation will reconcile on reload.
              setQuestions((qs) => [
                ...qs,
                { id: `tmp-${Date.now()}`, label: input.label, type: input.type, options: input.options, required: input.required },
              ])
            })
          }
        />
      </section>
    </div>
  )
}

function QuestionBuilder({
  onAdd,
  pending,
}: {
  onAdd: (input: QuestionInput) => void
  pending: boolean
}) {
  const [label, setLabel] = useState("")
  const [type, setType] = useState<CfpQuestionType>("short_text")
  const [required, setRequired] = useState(false)
  const [optionsText, setOptionsText] = useState("")
  const needsOptions = type === "select" || type === "multi_select"

  function add() {
    if (!label.trim()) return
    const options = needsOptions
      ? optionsText.split("\n").map((o) => o.trim()).filter(Boolean)
      : null
    if (needsOptions && (!options || options.length === 0)) return
    onAdd({ label: label.trim(), type, options, required })
    setLabel("")
    setOptionsText("")
    setRequired(false)
    setType("short_text")
  }

  return (
    <div className="border-t border-jsconf-border pt-5 flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="q-label">Question label</label>
          <input id="q-label" className={inputClass} value={label}
            onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Twitter / X handle" />
        </div>
        <div>
          <label className={labelClass} htmlFor="q-type">Type</label>
          <select id="q-type" className={inputClass} value={type}
            onChange={(e) => setType(e.target.value as CfpQuestionType)}>
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-jsconf-bg">{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {needsOptions && (
        <div>
          <label className={labelClass} htmlFor="q-options">Options (one per line)</label>
          <textarea id="q-options" rows={3} className={inputClass} value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)} placeholder={"Beginner\nIntermediate\nAdvanced"} />
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)}
            className="accent-jsconf-yellow h-4 w-4" />
          <span className="font-mono text-sm text-white">Required</span>
        </label>
        <button onClick={add} disabled={pending || !label.trim()}
          className="inline-flex items-center gap-2 border border-jsconf-yellow text-jsconf-yellow font-mono text-xs uppercase tracking-wide py-2.5 px-4 hover:bg-jsconf-yellow-dim transition-colors disabled:opacity-50">
          <Plus className="h-3.5 w-3.5" />
          Add question
        </button>
      </div>
    </div>
  )
}
