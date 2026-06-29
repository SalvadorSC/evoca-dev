"use client"

import Link from "next/link"
import useSWR from "swr"
import { Check } from "lucide-react"
import {
  PLANS,
  ORGANIZER_PLAN_IDS,
  formatPrice,
  type Currency,
  type PlanId,
} from "@/lib/plans"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface LocaleResponse {
  currency: Currency
  prices: Record<PlanId, { amount: number; displayMonthly: number | null }>
}

const FEATURES: Record<PlanId, string[]> = {
  organizer_onetime: ["Full organizer tools", "7-day live window", "Reactions, Q&A & presenting"],
  organizer_monthly: ["Unlimited events", "All features, always on", "Cancel anytime"],
  organizer_annual: ["Everything in Growth", "Best value", "Priority support"],
  speaker_pro_monthly: [],
  speaker_pro_annual: [],
}

function priceLabel(
  planId: PlanId,
  currency: Currency,
  prices: LocaleResponse["prices"] | null,
): { big: string; small: string } {
  const plan = PLANS[planId]
  const amount = prices?.[planId]?.amount ?? plan.amount[currency]
  if (plan.interval === "one_time") {
    return { big: formatPrice(amount, currency), small: "one-time · per event" }
  }
  const monthly = prices?.[planId]?.displayMonthly ?? plan.displayMonthly?.[currency] ?? amount
  return {
    big: formatPrice(monthly, currency),
    small: plan.interval === "year" ? "/mo · billed yearly" : "/mo",
  }
}

export function OrganizerPricing() {
  const { data } = useSWR<LocaleResponse>("/api/locale", fetcher, { revalidateOnFocus: false })
  const currency = data?.currency ?? "EUR"
  const prices = data?.prices ?? null

  return (
    <section className="px-6 py-16 border-t border-jsconf-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-foreground text-3xl mb-3 text-balance">
            Simple pricing for every event
          </h2>
          <p className="font-sans text-jsconf-muted text-base">
            Run a single conference or organize all year. Prices in {currency}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ORGANIZER_PLAN_IDS.map((planId, i) => {
            const plan = PLANS[planId]
            const label = priceLabel(planId, currency, prices)
            const featured = planId === "organizer_monthly"
            return (
              <div
                key={planId}
                className="border p-6 flex flex-col gap-4"
                style={{
                  borderColor: featured ? "var(--accent)" : "var(--jsconf-border)",
                  background: featured ? "var(--accent-dim)" : "transparent",
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display font-bold text-foreground text-xl">{plan.name}</h3>
                    {featured && (
                      <span
                        className="font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-0.5"
                        style={{ background: "var(--accent)", color: "var(--accent-text)" }}
                      >
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-display font-bold text-foreground text-3xl">{label.big}</span>
                    <span className="font-mono text-xs text-jsconf-muted">{label.small}</span>
                  </div>
                  <p className="font-sans text-sm text-jsconf-muted mt-2 leading-relaxed">{plan.description}</p>
                </div>

                <ul className="flex flex-col gap-2 flex-1">
                  {FEATURES[planId].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
                      <span className="font-sans text-sm text-foreground/80">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login?role=organizer"
                  className="text-center font-mono text-xs font-bold uppercase tracking-wider py-3 border-2 transition-colors"
                  style={
                    featured
                      ? { background: "var(--accent)", color: "var(--accent-text)", borderColor: "var(--accent)" }
                      : { borderColor: "var(--accent)", color: "var(--accent)" }
                  }
                >
                  Get started
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
