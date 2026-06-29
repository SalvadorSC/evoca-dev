// ─────────────────────────────────────────────────────────────────────────────
// Billing access logic — pure functions, safe to import on client or server.
// No secrets, no DB access here. DB reads happen in route handlers / RSC.
// See BUSINESS_LOGIC.md for the rules these encode.
// ─────────────────────────────────────────────────────────────────────────────

import type { PlanId } from "./plans"

export type OrganizerSubStatus =
  | "active"
  | "pending_activation"
  | "expired"
  | "cancelled"
  | "payment_failed"

export interface OrganizerSubscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_payment_intent_id: string | null
  plan: PlanId
  status: OrganizerSubStatus
  event_start: string | null
  event_end: string | null
  activated_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Organizer access tiers:
 *  - "none": no paid access. Free features only.
 *  - "prep": paid, but the live event window hasn't started (or has ended for a
 *            subscription that lapsed). Can manage conference setup, NOT present
 *            or run reactions / Q&A.
 *  - "live": full access including presenting, reactions and Q&A.
 */
export type OrganizerAccessLevel = "none" | "prep" | "live"

export interface OrganizerAccess {
  level: OrganizerAccessLevel
  plan: PlanId | null
  /** The subscription that grants the current access, if any. */
  subscriptionId: string | null
  /** When one-time access expires, or next billing date for subscriptions. */
  expiresAt: string | null
  eventStart: string | null
  eventEnd: string | null
}

const NONE: OrganizerAccess = {
  level: "none",
  plan: null,
  subscriptionId: null,
  expiresAt: null,
  eventStart: null,
  eventEnd: null,
}

function isSubscriptionPlan(plan: PlanId): boolean {
  return plan === "organizer_monthly" || plan === "organizer_annual"
}

/**
 * Computes the strongest organizer access from a set of subscription rows.
 * Picks the best level across all rows (a user may hold several).
 */
export function computeOrganizerAccess(
  subs: OrganizerSubscription[],
  now: Date = new Date(),
): OrganizerAccess {
  let best: OrganizerAccess = NONE
  const rank: Record<OrganizerAccessLevel, number> = { none: 0, prep: 1, live: 2 }

  for (const sub of subs) {
    const access = accessFromSub(sub, now)
    if (rank[access.level] > rank[best.level]) best = access
  }
  return best
}

function accessFromSub(sub: OrganizerSubscription, now: Date): OrganizerAccess {
  const base: OrganizerAccess = {
    level: "none",
    plan: sub.plan,
    subscriptionId: sub.id,
    expiresAt: sub.expires_at,
    eventStart: sub.event_start,
    eventEnd: sub.event_end,
  }

  // Subscriptions: active => full live access (unlimited).
  if (isSubscriptionPlan(sub.plan)) {
    if (sub.status === "active") return { ...base, level: "live" }
    // payment_failed keeps prep access as a short grace; cancelled/expired => none.
    if (sub.status === "payment_failed") return { ...base, level: "prep" }
    return { ...base, level: "none" }
  }

  // One-time plan.
  if (sub.plan === "organizer_onetime") {
    if (sub.status === "cancelled" || sub.status === "expired") {
      return { ...base, level: "none" }
    }

    const start = sub.event_start ? new Date(sub.event_start) : null
    const end = sub.event_end ? new Date(sub.event_end) : null

    // No window set yet, or window in the future => prep only.
    if (!start || !end) return { ...base, level: "prep" }
    if (now < start) return { ...base, level: "prep" }
    if (now > end) return { ...base, level: "none" }
    // Within the event window => full live access.
    return { ...base, level: "live" }
  }

  return base
}

export function hasOrganizerPrep(access: OrganizerAccess): boolean {
  return access.level === "prep" || access.level === "live"
}

export function hasOrganizerLive(access: OrganizerAccess): boolean {
  return access.level === "live"
}

// ─────────────────────────────────────────────────────────────────────────────
// Speaker affiliation access (Phase 2)
// A speaker assigned to a conference slot gains event-scoped Pro access for the
// duration of that conference's paying window. This does NOT mutate the
// speakers.speaker_plan column — it is purely derived at runtime.
// ─────────────────────────────────────────────────────────────────────────────

export type AffiliationStatus = "pending" | "accepted" | "declined" | "revoked"

export interface SpeakerAffiliation {
  id: string
  event_id: string // conferences.id
  speaker_id: string | null
  invited_by: string
  email: string
  status: AffiliationStatus
  created_at: string
}

/**
 * Whether a speaker currently has event-scoped Pro access. True when the
 * speaker has an `accepted` affiliation whose conference subscription window
 * is currently active (or is an active recurring subscription).
 *
 * Pass the affiliations joined with the conference's paying subscription.
 */
export function hasEventScopedPro(
  affiliations: { status: AffiliationStatus; subscription: OrganizerSubscription | null }[],
  now: Date = new Date(),
): boolean {
  for (const aff of affiliations) {
    if (aff.status !== "accepted") continue
    if (!aff.subscription) continue
    const access = accessFromSub(aff.subscription, now)
    // The organizer must be at least "live" for speakers to present.
    if (access.level === "live") return true
  }
  return false
}

/** Validates that a one-time event window is within the allowed 7-day span. */
export const ONE_TIME_MAX_DAYS = 7

// ─────────────────────────────────────────────────────────────────────────────
// Conference slot types (Phase 2)
// ─────────────────────────────────────────────────────────────────────────────

export const SLOT_TYPES = ["talk", "keynote", "workshop", "lightning", "break", "panel"] as const
export type SlotType = (typeof SLOT_TYPES)[number]

/** Slot types that accept a speaker assignment. */
export const SPEAKER_SLOT_TYPES: SlotType[] = ["talk", "keynote", "workshop", "lightning", "panel"]

export function slotAcceptsSpeaker(type: SlotType): boolean {
  return SPEAKER_SLOT_TYPES.includes(type)
}

export const MAX_CONFERENCE_DAYS = 5

export function validateEventWindow(
  startISO: string,
  endISO: string,
): { ok: true } | { ok: false; error: string } {
  const start = new Date(startISO)
  const end = new Date(endISO)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { ok: false, error: "Invalid dates." }
  }
  if (end <= start) {
    return { ok: false, error: "End must be after start." }
  }
  const spanMs = end.getTime() - start.getTime()
  const maxMs = ONE_TIME_MAX_DAYS * 24 * 60 * 60 * 1000
  if (spanMs > maxMs) {
    return { ok: false, error: `Event window cannot exceed ${ONE_TIME_MAX_DAYS} days.` }
  }
  return { ok: true }
}
