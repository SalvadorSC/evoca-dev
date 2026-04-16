"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, ArrowRight, Check, Link2, FileText, SkipForward } from "lucide-react"

type Step = 1 | 2 | 3

type FormData = {
  title: string
  description: string
  slideUrl: string
  slideType: "url" | "none"
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

function StepIndicator({ current, total }: { current: Step; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => {
        const step = (i + 1) as Step
        const done = current > step
        const active = current === step
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 flex items-center justify-center font-mono text-xs font-bold border transition-all duration-150 ${
                done
                  ? "bg-jsconf-yellow border-jsconf-yellow text-black"
                  : active
                  ? "border-jsconf-yellow text-jsconf-yellow"
                  : "border-jsconf-border text-jsconf-muted"
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : step}
            </div>
            {i < total - 1 && (
              <div className={`h-px w-8 ${done ? "bg-jsconf-yellow" : "bg-jsconf-border"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function NewTalkPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    slideUrl: "",
    slideType: "none",
  })

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  function next() {
    if (step === 1) {
      if (!form.title.trim()) {
        setError("Talk title is required.")
        return
      }
    }
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s))
  }

  function back() {
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s))
    setError(null)
  }

  function skipSlides() {
    update("slideType", "none")
    update("slideUrl", "")
    setStep(3)
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push("/login")
        return
      }

      // Build the slug locally — do NOT rely on .select() after insert
      // because RLS blocks the read-back and returns empty data silently.
      const baseSlug = slugify(form.title) || "talk"
      const suffix = Math.random().toString(36).slice(2, 6)
      const slug = `${baseSlug}-${suffix}`

      const { error: insertError } = await supabase
        .from("talks")
        .insert({
          user_id: session.user.id,
          title: form.title.trim(),
          description: form.description.trim() || null,
          slug,
          slide_url: form.slideUrl.trim() || null,
          slide_type: form.slideUrl.trim() ? form.slideType : null,
        })

      if (insertError) {
        setError(insertError.message)
        return
      }

      // Use the locally-built slug directly — no read-back needed
      router.push(`/dashboard/talks/${slug}`)
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-6 py-8 max-w-xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 font-mono text-xs text-jsconf-muted hover:text-white uppercase tracking-wider mb-8 transition-all duration-150"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Talks
      </Link>

      <h1 className="font-display font-bold text-2xl text-white uppercase tracking-wide mb-2">
        New Talk
      </h1>
      <p className="font-mono text-xs text-jsconf-muted mb-8">
        Set up your talk to start collecting live audience reactions.
      </p>

      <StepIndicator current={step} total={3} />

      {/* Step 1: Title + description */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div>
            <label className="block font-mono text-xs text-jsconf-muted uppercase tracking-wider mb-2">
              Talk Title <span className="text-jsconf-yellow">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. The Future of JavaScript"
              className="w-full bg-jsconf-surface border border-jsconf-border px-4 py-3 font-sans text-sm text-white placeholder:text-jsconf-muted focus:outline-none focus:border-jsconf-yellow transition-all duration-150"
              autoFocus
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-jsconf-muted uppercase tracking-wider mb-2">
              Description <span className="text-jsconf-muted font-normal normal-case">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="A brief description of your talk..."
              rows={4}
              className="w-full bg-jsconf-surface border border-jsconf-border px-4 py-3 font-sans text-sm text-white placeholder:text-jsconf-muted focus:outline-none focus:border-jsconf-yellow resize-none transition-all duration-150"
            />
          </div>
          {error && (
            <p className="font-mono text-xs text-jsconf-red">{error}</p>
          )}
          <button
            onClick={next}
            className="self-end inline-flex items-center gap-2 px-5 py-3 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-jsconf-yellow/90 transition-all duration-150"
          >
            Next
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Step 2: Slides */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <p className="font-mono text-xs text-jsconf-muted">
            Optionally link your slides. Attendees on the wall can see what slide you are on.
          </p>

          {/* Slides.com URL option */}
          <div
            className={`border p-4 cursor-pointer transition-all duration-150 ${
              form.slideType === "url"
                ? "border-jsconf-yellow bg-jsconf-yellow-dim"
                : "border-jsconf-border bg-jsconf-surface hover:border-jsconf-muted"
            }`}
            onClick={() => update("slideType", "url")}
          >
            <div className="flex items-center gap-3 mb-3">
              <Link2 className="h-4 w-4 text-jsconf-yellow" />
              <span className="font-mono text-sm text-white">Paste a Slides.com URL</span>
            </div>
            {form.slideType === "url" && (
              <input
                type="url"
                value={form.slideUrl}
                onChange={(e) => update("slideUrl", e.target.value)}
                placeholder="https://slides.com/you/your-talk"
                className="w-full bg-jsconf-bg border border-jsconf-border px-3 py-2.5 font-mono text-sm text-white placeholder:text-jsconf-muted focus:outline-none focus:border-jsconf-yellow"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>

          {/* PDF note */}
          <div className="border border-jsconf-border bg-jsconf-surface p-4 flex items-start gap-3 opacity-50">
            <FileText className="h-4 w-4 text-jsconf-muted mt-0.5 shrink-0" />
            <div>
              <span className="font-mono text-sm text-jsconf-muted">Upload PDF / PPTX</span>
              <p className="font-mono text-xs text-jsconf-muted mt-1">Coming soon on Pro plan</p>
            </div>
          </div>

          {error && (
            <p className="font-mono text-xs text-jsconf-red">{error}</p>
          )}

          <div className="flex items-center justify-between mt-2">
            <button
              onClick={back}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-jsconf-border font-mono text-xs uppercase tracking-wider text-jsconf-muted hover:text-white hover:border-white transition-all duration-150"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={skipSlides}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 font-mono text-xs uppercase tracking-wider text-jsconf-muted hover:text-white transition-all duration-150"
              >
                <SkipForward className="h-3.5 w-3.5" />
                Skip
              </button>
              <button
                onClick={next}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-jsconf-yellow/90 transition-all duration-150"
              >
                Next
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div className="bg-jsconf-surface border border-jsconf-border p-5 flex flex-col gap-4">
            <div>
              <span className="font-mono text-[10px] text-jsconf-muted uppercase tracking-wider block mb-1">Title</span>
              <p className="font-display font-bold text-white">{form.title}</p>
            </div>
            {form.description && (
              <div>
                <span className="font-mono text-[10px] text-jsconf-muted uppercase tracking-wider block mb-1">Description</span>
                <p className="font-sans text-sm text-jsconf-muted leading-relaxed">{form.description}</p>
              </div>
            )}
            <div>
              <span className="font-mono text-[10px] text-jsconf-muted uppercase tracking-wider block mb-1">Slides</span>
              <p className="font-mono text-sm text-white">
                {form.slideUrl ? form.slideUrl : "None — skipped"}
              </p>
            </div>
          </div>

          {error && (
            <p className="font-mono text-xs text-jsconf-red">{error}</p>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={back}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-jsconf-border font-mono text-xs uppercase tracking-wider text-jsconf-muted hover:text-white hover:border-white transition-all duration-150 disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-jsconf-yellow/90 transition-all duration-150 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Talk"}
              {!loading && <Check className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
