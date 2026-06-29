"use client"

import { useEffect, useState } from "react"
import { CalendarClock, Zap, CreditCard, CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { usePaywall } from "@/components/billing/paywall-provider"
import { PLANS } from "@/lib/plans"
import { ONE_TIME_MAX_DAYS } from "@/lib/billing"

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

const LEVEL_LABEL: Record<string, { text: string; color: string }> = {
  none: { text: "No organizer plan", color: "#888" },
  prep: { text: "Paid — preparing", color: "#F97316" },
  live: { text: "Active — live", color: "#22c55e" },
}

export function OrganizerPlanSection() {
  const { access, isLoading, openPaywall, refresh } = usePaywall()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [windowMode, setWindowMode] = useState<"now" | "schedule">("now")
  const [startAt, setStartAt] = useState("")
  const [endAt, setEndAt] = useState("")
  const [justPurchased, setJustPurchased] = useState(false)

  // Refresh access after returning from Stripe checkout.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("checkout") === "success") {
      setJustPurchased(true)
      const t = setTimeout(() => refresh(), 1500)
      return () => clearTimeout(t)
    }
  }, [refresh])

  const planName = access.plan ? PLANS[access.plan]?.name : null
  const isOneTime = access.plan === "organizer_onetime"
  const isSubscription =
    access.plan === "organizer_monthly" || access.plan === "organizer_annual"
  const needsActivation = isOneTime && !access.eventStart

  async function handleActivate() {
    setBusy(true)
    setError(null)
    try {
      const body: Record<string, unknown> =
        windowMode === "now"
          ? { activateNow: true }
          : { eventStart: startAt ? new Date(startAt).toISOString() : "", eventEnd: endAt ? new Date(endAt).toISOString() : "" }

      if (windowMode === "schedule" && (!startAt || !endAt)) {
        setError("Choose a start and end date.")
        setBusy(false)
        return
      }

      const res = await fetch("/api/billing/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Could not activate.")
        setBusy(false)
        return
      }
      refresh()
      setBusy(false)
    } catch {
      setError("Something went wrong.")
      setBusy(false)
    }
  }

  async function handlePortal() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Could not open billing portal.")
        setBusy(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError("Something went wrong.")
      setBusy(false)
    }
  }

  const level = LEVEL_LABEL[access.level]

  return (
    <div className="border-t border-jsconf-border pt-8 mt-8">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-foreground uppercase tracking-wide text-lg">
            Organizer plan
          </h2>
          <p className="font-mono text-xs text-jsconf-muted mt-1">
            Tools for running your conference — schedule, tracks, live engagement.
          </p>
        </div>
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-1 shrink-0"
          style={{ background: level.color, color: "#000" }}
        >
          {level.text}
        </span>
      </div>

      {justPurchased && (
        <div className="flex items-center gap-2 border border-green-500/40 bg-green-500/10 px-4 py-3 mb-4">
          <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
          <span className="font-mono text-xs text-green-300">
            Payment received. Your plan is being set up…
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 font-mono text-xs text-jsconf-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading plan…
        </div>
      ) : access.level === "none" ? (
        <div className="border border-jsconf-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="font-sans text-sm text-foreground/80">
            You don&apos;t have an organizer plan yet. Choose one to start building your event.
          </p>
          <button
            onClick={() => openPaywall("Choose an organizer plan to get started.")}
            className="inline-flex items-center justify-center gap-2 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider px-5 py-3 hover:bg-jsconf-yellow/90 transition-colors shrink-0"
          >
            <Sparkles className="h-4 w-4" /> Choose a plan
          </button>
        </div>
      ) : (
        <div className="border border-jsconf-border p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-display font-bold text-foreground text-lg">{planName}</span>
            <button
              onClick={() => openPaywall("Change your organizer plan.")}
              className="font-mono text-[11px] uppercase tracking-wider text-jsconf-yellow hover:underline"
            >
              Change plan
            </button>
          </div>

          {/* One-time window details / activation */}
          {isOneTime && access.eventStart && (
            <div className="font-mono text-xs text-jsconf-muted">
              Event window:{" "}
              <span className="text-foreground">{formatDate(access.eventStart)}</span> →{" "}
              <span className="text-foreground">{formatDate(access.eventEnd)}</span>
              {access.level === "prep" && (
                <span className="block mt-1 text-jsconf-orange">
                  Live features unlock when the window starts.
                </span>
              )}
            </div>
          )}

          {needsActivation && (
            <div className="flex flex-col gap-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-jsconf-muted">
                Set your event window ({ONE_TIME_MAX_DAYS} days max)
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setWindowMode("now")}
                  className={`flex-1 flex items-center gap-2 border px-3 py-2.5 font-mono text-xs transition-colors ${
                    windowMode === "now" ? "border-jsconf-yellow text-foreground" : "border-jsconf-border text-jsconf-muted hover:text-foreground"
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" /> Start now ({ONE_TIME_MAX_DAYS} days)
                </button>
                <button
                  type="button"
                  onClick={() => setWindowMode("schedule")}
                  className={`flex-1 flex items-center gap-2 border px-3 py-2.5 font-mono text-xs transition-colors ${
                    windowMode === "schedule" ? "border-jsconf-yellow text-foreground" : "border-jsconf-border text-jsconf-muted hover:text-foreground"
                  }`}
                >
                  <CalendarClock className="h-3.5 w-3.5" /> Schedule
                </button>
              </div>
              {windowMode === "schedule" && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex-1 flex flex-col gap-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-jsconf-muted">Start</span>
                    <input
                      type="datetime-local"
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                      className="bg-jsconf-bg border border-jsconf-border text-foreground font-mono text-xs p-2 focus:outline-none focus:border-jsconf-yellow"
                    />
                  </label>
                  <label className="flex-1 flex flex-col gap-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-jsconf-muted">End</span>
                    <input
                      type="datetime-local"
                      value={endAt}
                      onChange={(e) => setEndAt(e.target.value)}
                      className="bg-jsconf-bg border border-jsconf-border text-foreground font-mono text-xs p-2 focus:outline-none focus:border-jsconf-yellow"
                    />
                  </label>
                </div>
              )}
              <button
                onClick={handleActivate}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider py-2.5 hover:bg-jsconf-yellow/90 disabled:opacity-60 transition-colors"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "Saving…" : "Activate event"}
              </button>
            </div>
          )}

          {/* Subscription details */}
          {isSubscription && (
            <div className="flex flex-col gap-3">
              <div className="font-mono text-xs text-jsconf-muted">
                Renews / expires:{" "}
                <span className="text-foreground">{formatDate(access.expiresAt)}</span>
              </div>
              <button
                onClick={handlePortal}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 border border-jsconf-border text-foreground font-mono text-xs font-bold uppercase tracking-wider py-2.5 hover:border-white/40 disabled:opacity-60 transition-colors"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Manage billing
              </button>
            </div>
          )}

          {error && <p className="font-mono text-xs text-jsconf-red">{error}</p>}
        </div>
      )}
    </div>
  )
}
