// ─────────────────────────────────────────────────────────────────────────────
// Plan catalog — the single source of truth for pricing.
// Prices are validated server-side; clients only ever send a planId.
// See BUSINESS_LOGIC.md and docs/phase-1-billing-foundation.md.
// ─────────────────────────────────────────────────────────────────────────────

export type Currency = "EUR" | "USD"

export type PlanId =
  | "organizer_onetime"
  | "organizer_monthly"
  | "organizer_annual"
  // Speaker Pro — defined but NOT surfaced in UI yet (Phase 1 stub).
  | "speaker_pro_monthly"
  | "speaker_pro_annual"

export type StripeMode = "payment" | "subscription"
export type BillingInterval = "month" | "year" | "one_time"
export type PlanAudience = "organizer" | "speaker"

export interface PlanPrice {
  /** Amount charged per billing cycle, in the currency's minor unit (cents). */
  EUR: number
  USD: number
}

export interface Plan {
  id: PlanId
  audience: PlanAudience
  name: string
  description: string
  mode: StripeMode
  interval: BillingInterval
  /** Amount per Stripe charge (the recurring amount, or the one-time amount). */
  amount: PlanPrice
  /**
   * Display price shown to the user as "per month equivalent".
   * For annual plans this is amount / 12, for clearer comparison.
   */
  displayMonthly?: PlanPrice
  /** For subscription plans, Stripe's recurring interval. */
  recurringInterval?: "month" | "year"
  /** One-time plans grant access for this many days from activation. */
  accessDays?: number
  /** Whether this plan is live in the UI. Speaker Pro stays false in Phase 1. */
  live: boolean
}

// EUR is the base. USD values are pre-rounded equivalents (see BUSINESS_LOGIC.md).
export const PLANS: Record<PlanId, Plan> = {
  organizer_onetime: {
    id: "organizer_onetime",
    audience: "organizer",
    name: "One-time Event",
    description: "Full organizer tools for a single 7-day event window.",
    mode: "payment",
    interval: "one_time",
    amount: { EUR: 4900, USD: 5400 },
    accessDays: 7,
    live: true,
  },
  organizer_monthly: {
    id: "organizer_monthly",
    audience: "organizer",
    name: "Growth",
    description: "Unlimited events, billed monthly.",
    mode: "subscription",
    interval: "month",
    recurringInterval: "month",
    amount: { EUR: 2900, USD: 3200 },
    displayMonthly: { EUR: 2900, USD: 3200 },
    live: true,
  },
  organizer_annual: {
    id: "organizer_annual",
    audience: "organizer",
    name: "Scale",
    description: "Unlimited everything, billed yearly.",
    mode: "subscription",
    interval: "year",
    recurringInterval: "year",
    // €89/mo billed yearly => €1068/yr. USD: $99/mo => $1188/yr.
    amount: { EUR: 106800, USD: 118800 },
    displayMonthly: { EUR: 8900, USD: 9900 },
    live: true,
  },
  // ── Speaker Pro: stubbed, not shown in UI (Phase 1) ──
  speaker_pro_monthly: {
    id: "speaker_pro_monthly",
    audience: "speaker",
    name: "Speaker Pro",
    description: "Premium speaker features, billed monthly.",
    mode: "subscription",
    interval: "month",
    recurringInterval: "month",
    amount: { EUR: 700, USD: 800 },
    displayMonthly: { EUR: 700, USD: 800 },
    live: false,
  },
  speaker_pro_annual: {
    id: "speaker_pro_annual",
    audience: "speaker",
    name: "Speaker Pro",
    description: "Premium speaker features, billed yearly.",
    mode: "subscription",
    interval: "year",
    recurringInterval: "year",
    // €5/mo billed yearly => €60/yr. USD: $6/mo => $72/yr.
    amount: { EUR: 6000, USD: 7200 },
    displayMonthly: { EUR: 500, USD: 600 },
    live: false,
  },
}

export const ORGANIZER_PLAN_IDS: PlanId[] = [
  "organizer_onetime",
  "organizer_monthly",
  "organizer_annual",
]

export function getPlan(id: string): Plan | undefined {
  return (PLANS as Record<string, Plan>)[id]
}

export function isLivePlan(id: string): boolean {
  const plan = getPlan(id)
  return !!plan && plan.live
}

const SYMBOLS: Record<Currency, string> = { EUR: "€", USD: "$" }

/** Formats a minor-unit amount, dropping the decimals when it's a round number. */
export function formatPrice(amountMinor: number, currency: Currency): string {
  const major = amountMinor / 100
  const symbol = SYMBOLS[currency]
  const formatted = Number.isInteger(major) ? major.toString() : major.toFixed(2)
  return `${symbol}${formatted}`
}
