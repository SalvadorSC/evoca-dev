"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Check, Loader2, CalendarClock, Zap } from "lucide-react"
import {
  PLANS,
  ORGANIZER_PLAN_IDS,
  formatPrice,
  type Currency,
  type PlanId,
} from "@/lib/plans"
import { ONE_TIME_MAX_DAYS, type OrganizerAccess } from "@/lib/billing"
import type { PriceInfo } from "./paywall-provider"

const PLAN_FEATURES: Record<PlanId, string[]> = {
  organizer_onetime: [
    "Full organizer tools for one event",
    "7-day live window",
    "Reactions, Q&A & presenting during the event",
  ],
  organizer_monthly: [
    "Unlimited events",
    "All organizer features, always on",
    "Cancel anytime",
  ],
  organizer_annual: [
    "Everything in Growth",
    "Best value — billed yearly",
    "Priority support",
  ],
  speaker_pro_monthly: [],
  speaker_pro_annual: [],
}

function intervalLabel(planId: PlanId): string {
  const plan = PLANS[planId]
  if (plan.interval === "one_time") return "one-time"
  if (plan.interval === "year") return "/mo billed yearly"
  return "/mo"
}

export function PaywallModal({
  open,
  onOpenChange,
  reason,
  currency,
  prices,
  currentAccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  reason?: string
  currency: Currency
  prices: Record<PlanId, PriceInfo> | null
  currentAccess: OrganizerAccess
}) {
  const [selected, setSelected] = useState<PlanId>("organizer_monthly")
  const [windowMode, setWindowMode] = useState<"now" | "schedule">("now")
  const [startAt, setStartAt] = useState("")
  const [endAt, setEndAt] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function priceFor(planId: PlanId): number {
    return prices?.[planId]?.amount ?? PLANS[planId].amount[currency]
  }

  function displayAmount(planId: PlanId): string {
    const plan = PLANS[planId]
    if (plan.interval === "year") {
      const monthly = prices?.[planId]?.displayMonthly ?? plan.displayMonthly?.[currency] ?? 0
      return formatPrice(monthly, currency)
    }
    return formatPrice(priceFor(planId), currency)
  }

  async function handleContinue() {
    setSubmitting(true)
    setError(null)
    try {
      const body: Record<string, unknown> = { planId: selected }
      if (selected === "organizer_onetime") {
        if (windowMode === "now") {
          body.activateNow = true
        } else {
          if (!startAt || !endAt) {
            setError("Please choose a start and end date.")
            setSubmitting(false)
            return
          }
          const spanMs = new Date(endAt).getTime() - new Date(startAt).getTime()
          if (spanMs <= 0) {
            setError("End must be after start.")
            setSubmitting(false)
            return
          }
          if (spanMs > ONE_TIME_MAX_DAYS * 86400000) {
            setError(`Event window cannot exceed ${ONE_TIME_MAX_DAYS} days.`)
            setSubmitting(false)
            return
          }
          body.eventStart = new Date(startAt).toISOString()
          body.eventEnd = new Date(endAt).toISOString()
        }
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Could not start checkout.")
        setSubmitting(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError("Something went wrong. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-jsconf-surface border-jsconf-border text-foreground max-w-2xl rounded-none p-0 gap-0">
        <DialogHeader className="p-6 border-b border-jsconf-border">
          <DialogTitle className="font-display font-bold uppercase tracking-wide text-xl text-foreground">
            Organizer plans
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-jsconf-muted">
            {reason ?? "Choose a plan to unlock organizer features."}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 flex flex-col gap-3">
          {ORGANIZER_PLAN_IDS.map((planId) => {
            const plan = PLANS[planId]
            const isSelected = selected === planId
            return (
              <button
                key={planId}
                type="button"
                onClick={() => setSelected(planId)}
                className={`w-full text-left border p-4 flex items-start gap-4 transition-colors ${
                  isSelected
                    ? "border-jsconf-yellow bg-jsconf-yellow-dim"
                    : "border-jsconf-border hover:border-white/30"
                }`}
              >
                <span
                  className={`mt-1 h-4 w-4 shrink-0 border flex items-center justify-center ${
                    isSelected ? "border-jsconf-yellow bg-jsconf-yellow" : "border-jsconf-muted"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 text-black" />}
                </span>
                <span className="flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-display font-bold text-foreground">{plan.name}</span>
                    <span className="font-mono text-sm text-foreground">
                      {displayAmount(planId)}
                      <span className="text-jsconf-muted text-xs"> {intervalLabel(planId)}</span>
                    </span>
                  </span>
                  <span className="font-sans text-sm text-foreground/70 block mt-1">{plan.description}</span>
                  <ul className="mt-2 flex flex-col gap-1">
                    {PLAN_FEATURES[planId].map((f) => (
                      <li key={f} className="flex items-center gap-2 font-mono text-[11px] text-jsconf-muted">
                        <Check className="h-3 w-3 text-jsconf-yellow shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </span>
              </button>
            )
          })}

          {/* One-time event window options */}
          {selected === "organizer_onetime" && (
            <div className="border border-jsconf-border p-4 flex flex-col gap-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-jsconf-muted">
                When does your event run?
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setWindowMode("now")}
                  className={`flex-1 flex items-center gap-2 border px-3 py-2.5 font-mono text-xs transition-colors ${
                    windowMode === "now"
                      ? "border-jsconf-yellow text-foreground"
                      : "border-jsconf-border text-jsconf-muted hover:text-foreground"
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  Activate now ({ONE_TIME_MAX_DAYS} days)
                </button>
                <button
                  type="button"
                  onClick={() => setWindowMode("schedule")}
                  className={`flex-1 flex items-center gap-2 border px-3 py-2.5 font-mono text-xs transition-colors ${
                    windowMode === "schedule"
                      ? "border-jsconf-yellow text-foreground"
                      : "border-jsconf-border text-jsconf-muted hover:text-foreground"
                  }`}
                >
                  <CalendarClock className="h-3.5 w-3.5" />
                  Schedule dates
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
              <p className="font-mono text-[10px] text-jsconf-muted leading-relaxed">
                Before the event starts you can prepare your conference. Reactions, Q&A and
                presenting unlock during the live window.
              </p>
            </div>
          )}

          {error && (
            <p className="font-mono text-xs text-jsconf-red border border-jsconf-red/40 px-3 py-2">{error}</p>
          )}

          <button
            type="button"
            onClick={handleContinue}
            disabled={submitting}
            className="mt-1 inline-flex items-center justify-center gap-2 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider py-3 hover:bg-jsconf-yellow/90 disabled:opacity-60 transition-colors"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Redirecting…" : "Continue to payment"}
          </button>
          <p className="font-mono text-[10px] text-jsconf-muted text-center">
            Secure checkout powered by Stripe. Prices in {currency}.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
