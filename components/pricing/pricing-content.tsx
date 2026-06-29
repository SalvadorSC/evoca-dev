"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Check, ArrowLeft } from "lucide-react"
import { ThemeSwitcher } from "@/components/theme/theme-switcher"
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

type Audience = "speaker" | "organizer"
type SpeakerInterval = "month" | "year"

const ORGANIZER_FEATURES: Record<PlanId, string[]> = {
  organizer_onetime: [
    "Full organizer toolkit",
    "7-day live event window",
    "Unlimited talks & sessions",
    "Live reactions, Q&A & polls",
    "Presenter & moderation tools",
  ],
  organizer_monthly: [
    "Everything in One-time Event",
    "Unlimited events, always on",
    "Call for Papers & review board",
    "Speaker management",
    "Cancel anytime",
  ],
  organizer_annual: [
    "Everything in Growth",
    "Two months free vs monthly",
    "Priority support",
    "Early access to new features",
  ],
  speaker_pro_monthly: [],
  speaker_pro_annual: [],
}

const SPEAKER_PRO_FEATURES = [
  "Unlimited talks (vs 5 on Free)",
  "Audience analytics & insights",
  "No EVOCA watermark",
  "Custom branding on slides",
  "Priority phone remote",
]

const FREE_FEATURES = [
  "Up to 5 talks, free forever",
  "Live reactions & Q&A",
  "Phone slide remote",
  "PDF / PPTX / embed slides",
  "No credit card required",
]

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Is the Free plan really free forever?",
    a: "Yes. Speakers can run up to 5 talks with live reactions, Q&A and the phone remote without ever entering a credit card. Upgrade only when you need more.",
  },
  {
    q: "What's the difference between speaker and organizer plans?",
    a: "Speaker plans are for individuals presenting talks. Organizer plans unlock conference-wide tools: scheduling, multiple speakers, Call for Papers and an all-year event window.",
  },
  {
    q: "What happens to Q&A after the talk?",
    a: "When you end a session, the questions are saved to your dashboard so you can revisit them anytime under the talk's Q&A History.",
  },
  {
    q: "Can I run a single conference without a subscription?",
    a: "Yes. The One-time Event plan gives you the full organizer toolkit for a single 7-day window — no recurring charge.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Subscriptions can be cancelled at any time and you keep access until the end of your billing period.",
  },
]

function organizerPriceLabel(
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

// ─── Nav ────────────────────────────────────────────────────────────────────
function PricingNav() {
  return (
    <nav className="sticky top-0 z-50 bg-jsconf-bg/95 backdrop-blur border-b border-jsconf-border px-6 py-4 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 text-jsconf-muted hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span className="font-mono text-sm font-bold tracking-wide text-foreground">EVOCA</span>
      </Link>
      <div className="flex items-center gap-4">
        <ThemeSwitcher />
        <Link
          href="/login"
          className="font-mono text-sm font-bold px-4 py-2 transition-colors bg-primary text-primary-foreground"
        >
          Get started free →
        </Link>
      </div>
    </nav>
  )
}

// ─── Audience toggle ──────────────────────────────────────────────────────────
function AudienceToggle({ audience, onChange }: { audience: Audience; onChange: (a: Audience) => void }) {
  return (
    <div className="inline-flex border border-jsconf-border" role="tablist" aria-label="Choose audience">
      {(["speaker", "organizer"] as Audience[]).map((a) => {
        const active = audience === a
        return (
          <button
            key={a}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(a)}
            className={`font-mono text-xs font-bold uppercase tracking-wider px-5 py-2.5 transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-jsconf-muted hover:text-foreground"
            }`}
          >
            {a === "speaker" ? "For Speakers" : "For Organizers"}
          </button>
        )
      })}
    </div>
  )
}

// ─── Speaker Pro waitlist ─────────────────────────────────────────────────────
function ProWaitlistForm() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg("Please enter a valid email address.")
      setState("error")
      return
    }
    setState("loading")
    setErrorMsg("")
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      })
      if (res.ok) {
        setState("done")
      } else {
        const body = await res.json().catch(() => ({}))
        setErrorMsg(body.error ?? "Something went wrong.")
        setState("error")
      }
    } catch {
      setErrorMsg("Something went wrong.")
      setState("error")
    }
  }

  if (state === "done") {
    return (
      <p className="font-mono text-xs text-jsconf-yellow uppercase tracking-wider">
        You&apos;re on the list. We&apos;ll reach out when Pro launches.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
      <label htmlFor="pro-waitlist-email" className="sr-only">
        Email address for Speaker Pro waitlist
      </label>
      <div className="flex flex-col sm:flex-row w-full">
        <input
          id="pro-waitlist-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (state === "error") setState("idle")
          }}
          placeholder="your@email.com"
          className="flex-1 min-w-0 bg-jsconf-surface border border-jsconf-border text-foreground font-sans text-sm placeholder:text-jsconf-muted px-3 h-10 focus:outline-none focus:border-jsconf-muted transition-colors sm:border-r-0"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="font-mono text-xs font-bold uppercase tracking-wider text-jsconf-muted border border-jsconf-border px-4 h-10 hover:text-foreground hover:border-jsconf-muted transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          {state === "loading" ? "..." : "Notify me"}
        </button>
      </div>
      {state === "error" && (
        <p className="font-mono text-[11px] text-destructive" role="alert">
          {errorMsg}
        </p>
      )}
    </form>
  )
}

// ─── Plan card shell ──────────────────────────────────────────────────────────
function PlanCard({
  name,
  badge,
  featured,
  big,
  small,
  description,
  features,
  children,
}: {
  name: string
  badge?: string
  featured?: boolean
  big: string
  small: string
  description: string
  features: string[]
  children: React.ReactNode
}) {
  return (
    <div
      className={`border p-6 flex flex-col gap-4 ${
        featured ? "border-jsconf-yellow bg-jsconf-yellow-dim" : "border-jsconf-border bg-transparent"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display font-bold text-foreground text-xl">{name}</h3>
          {badge && (
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-primary text-primary-foreground">
              {badge}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="font-display font-bold text-foreground text-3xl">{big}</span>
          <span className="font-mono text-xs text-jsconf-muted">{small}</span>
        </div>
        <p className="font-sans text-sm text-jsconf-muted mt-2 leading-relaxed">{description}</p>
      </div>

      <ul className="flex flex-col gap-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-jsconf-yellow" aria-hidden="true" />
            <span className="font-sans text-sm text-foreground/80">{f}</span>
          </li>
        ))}
      </ul>

      {children}
    </div>
  )
}

// ─── Speaker plans ────────────────────────────────────────────────────────────
function SpeakerPlans({ currency }: { currency: Currency }) {
  const [interval, setInterval] = useState<SpeakerInterval>("year")
  const proPlan = interval === "year" ? PLANS.speaker_pro_annual : PLANS.speaker_pro_monthly
  const proMonthly = proPlan.displayMonthly?.[currency] ?? proPlan.amount[currency]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-center">
        <div className="inline-flex border border-jsconf-border" role="group" aria-label="Billing interval">
          {(["month", "year"] as SpeakerInterval[]).map((iv) => {
            const active = interval === iv
            return (
              <button
                key={iv}
                onClick={() => setInterval(iv)}
                aria-pressed={active}
                className={`font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "text-jsconf-muted hover:text-foreground"
                }`}
              >
                {iv === "month" ? "Monthly" : "Annual · save 17%"}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto w-full">
        <PlanCard
          name="Free"
          big={formatPrice(0, currency)}
          small="forever"
          description="Everything you need to make your talks interactive."
          features={FREE_FEATURES}
        >
          <Link
            href="/login?role=speaker"
            className="text-center font-mono text-xs font-bold uppercase tracking-wider py-3 border-2 border-jsconf-yellow text-jsconf-yellow hover:bg-jsconf-yellow hover:text-jsconf-bg transition-colors"
          >
            Get started free
          </Link>
        </PlanCard>

        <PlanCard
          name="Speaker Pro"
          badge="Coming soon"
          featured
          big={formatPrice(proMonthly, currency)}
          small={interval === "year" ? "/mo · billed yearly" : "/mo"}
          description="For frequent speakers who want more reach and a clean, branded stage."
          features={SPEAKER_PRO_FEATURES}
        >
          <ProWaitlistForm />
        </PlanCard>
      </div>
      <p className="text-center font-sans text-xs text-jsconf-muted">
        Speaker Pro isn&apos;t available for purchase yet — join the waitlist and we&apos;ll let you know the moment it launches.
      </p>
    </div>
  )
}

// ─── Organizer plans ──────────────────────────────────────────────────────────
function OrganizerPlans({
  currency,
  prices,
}: {
  currency: Currency
  prices: LocaleResponse["prices"] | null
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto w-full">
      {ORGANIZER_PLAN_IDS.map((planId) => {
        const plan = PLANS[planId]
        const label = organizerPriceLabel(planId, currency, prices)
        const featured = planId === "organizer_monthly"
        return (
          <PlanCard
            key={planId}
            name={plan.name}
            badge={featured ? "Popular" : undefined}
            featured={featured}
            big={label.big}
            small={label.small}
            description={plan.description}
            features={ORGANIZER_FEATURES[planId]}
          >
            <Link
              href="/login?role=organizer"
              className={`text-center font-mono text-xs font-bold uppercase tracking-wider py-3 border-2 transition-colors ${
                featured
                  ? "bg-jsconf-yellow text-jsconf-bg border-jsconf-yellow hover:opacity-90"
                  : "border-jsconf-yellow text-jsconf-yellow hover:bg-jsconf-yellow hover:text-jsconf-bg"
              }`}
            >
              Get started
            </Link>
          </PlanCard>
        )
      })}
    </div>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function PricingFAQ() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="max-w-2xl mx-auto w-full">
      <h2 className="font-display font-bold text-foreground text-2xl mb-6 text-center text-balance">
        Frequently asked questions
      </h2>
      <div className="divide-y divide-jsconf-border border-y border-jsconf-border">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={i}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between py-4 text-left cursor-pointer gap-4"
              >
                <span className="font-sans text-foreground">{item.q}</span>
                <span className="font-mono text-jsconf-muted shrink-0">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && <p className="font-sans text-jsconf-muted text-sm pb-4 leading-relaxed">{item.a}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────
export function PricingContent() {
  const [audience, setAudience] = useState<Audience>("speaker")
  const { data } = useSWR<LocaleResponse>("/api/locale", fetcher, { revalidateOnFocus: false })
  const currency = data?.currency ?? "EUR"
  const prices = data?.prices ?? null

  return (
    <main className="min-h-screen bg-jsconf-bg text-foreground">
      <PricingNav />

      <section className="px-6 pt-16 pb-10 text-center">
        <h1 className="font-display font-bold text-foreground text-4xl md:text-5xl mb-4 text-balance">
          Pricing that scales with you
        </h1>
        <p className="font-sans text-jsconf-muted text-base md:text-lg max-w-xl mx-auto text-pretty mb-8">
          Start free with 5 talks and no credit card. Upgrade when you need unlimited talks, analytics, or full
          conference tools. Prices in {currency}.
        </p>
        <div className="flex justify-center">
          <AudienceToggle audience={audience} onChange={setAudience} />
        </div>
      </section>

      <section className="px-6 pb-16">
        {audience === "speaker" ? (
          <SpeakerPlans currency={currency} />
        ) : (
          <OrganizerPlans currency={currency} prices={prices} />
        )}
      </section>

      <section className="px-6 py-16 border-t border-jsconf-border">
        <PricingFAQ />
      </section>
    </main>
  )
}
