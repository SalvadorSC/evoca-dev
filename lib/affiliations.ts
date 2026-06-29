import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Speaker affiliation logic (Phase 2).
 *
 * All functions here use the service-role admin client and therefore MUST only
 * be called after the caller's ownership of the conference has been verified.
 *
 * Model:
 *  - `conference_slots.speaker_email` holds the invited email (even before the
 *    speaker has an account).
 *  - `conference_slots.speaker_id` is set once the email maps to a real account.
 *  - `event_speaker_affiliations` tracks invite status per (conference, email).
 */

/** Resolve an email to an existing speaker's auth user id, or null. */
async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("speakers")
    .select("user_id")
    .ilike("email", email)
    .limit(1)
    .maybeSingle()
  return (data?.user_id as string | undefined) ?? null
}

export interface AssignResult {
  status: "accepted" | "pending"
  hasAccount: boolean
}

/**
 * Assign a speaker (by email) to a slot. Upserts the affiliation and updates
 * the slot. If the email matches an existing account, the affiliation is
 * `accepted` immediately; otherwise it is `pending` until the user signs up.
 */
export async function assignSpeakerToSlot(opts: {
  conferenceId: string
  slotId: string
  email: string
  invitedBy: string
}): Promise<AssignResult> {
  const admin = createAdminClient()
  const email = opts.email.trim().toLowerCase()

  const userId = await findUserIdByEmail(email)
  const hasAccount = userId !== null
  const status: "accepted" | "pending" = hasAccount ? "accepted" : "pending"

  // Upsert affiliation keyed by (event_id, email). Resurrect revoked rows.
  const { data: existing } = await admin
    .from("event_speaker_affiliations")
    .select("id")
    .eq("event_id", opts.conferenceId)
    .ilike("email", email)
    .maybeSingle()

  if (existing) {
    await admin
      .from("event_speaker_affiliations")
      .update({ status, speaker_id: userId })
      .eq("id", existing.id)
  } else {
    await admin.from("event_speaker_affiliations").insert({
      event_id: opts.conferenceId,
      speaker_id: userId,
      invited_by: opts.invitedBy,
      email,
      status,
    })
  }

  // Link the slot.
  await admin
    .from("conference_slots")
    .update({ speaker_email: email, speaker_id: userId })
    .eq("id", opts.slotId)

  return { status, hasAccount }
}

/**
 * Remove a speaker from a slot. Clears the slot's speaker fields. If the email
 * is no longer referenced by any slot in the conference, the affiliation is
 * marked `revoked` (access removed).
 */
export async function unassignSpeakerFromSlot(opts: {
  conferenceId: string
  slotId: string
}): Promise<void> {
  const admin = createAdminClient()

  // Read the slot's current email before clearing it.
  const { data: slot } = await admin
    .from("conference_slots")
    .select("speaker_email")
    .eq("id", opts.slotId)
    .maybeSingle()

  const email = (slot?.speaker_email as string | null) ?? null

  await admin
    .from("conference_slots")
    .update({ speaker_email: null, speaker_id: null })
    .eq("id", opts.slotId)

  if (!email) return

  // Is the email still used by any other slot in this conference?
  const { data: dayRows } = await admin
    .from("conference_days")
    .select("id")
    .eq("conference_id", opts.conferenceId)
  const dayIds = (dayRows ?? []).map((d) => d.id as string)

  let stillUsed = false
  if (dayIds.length > 0) {
    const { data: others } = await admin
      .from("conference_slots")
      .select("id")
      .in("day_id", dayIds)
      .ilike("speaker_email", email)
      .limit(1)
    stillUsed = (others ?? []).length > 0
  }

  if (!stillUsed) {
    await admin
      .from("event_speaker_affiliations")
      .update({ status: "revoked", speaker_id: null })
      .eq("event_id", opts.conferenceId)
      .ilike("email", email)
  }
}

/**
 * A conference talk as seen from the speaker's side: one assigned slot, plus
 * the conference + paying-window context needed to render status & access.
 */
export interface SpeakerConferenceTalk {
  slotId: string
  title: string
  type: string
  startTime: string | null // "HH:MM:SS" (slot start, local to event)
  duration: number
  dayLabel: string
  dayDate: string | null // ISO date
  conferenceId: string
  conferenceName: string
  organizerName: string
  /** Paying window of the conference's subscription (drives status + read-only). */
  eventStart: string | null
  eventEnd: string | null
  subStatus: string | null
}

/**
 * All conference talks (slots) assigned to a speaker via an ACCEPTED
 * affiliation. Uses the admin client and is strictly scoped to `userId`, so a
 * speaker only ever sees their own assignments — never other speakers' slots.
 *
 * Conferences/slots are RLS-locked to the organizer, so a speaker's own client
 * cannot read them; this server-only helper bridges that gap safely.
 */
export async function getSpeakerConferenceTalks(
  userId: string,
): Promise<SpeakerConferenceTalk[]> {
  const admin = createAdminClient()

  // 1) Accepted affiliations for this speaker → which conferences.
  const { data: affs } = await admin
    .from("event_speaker_affiliations")
    .select("event_id")
    .eq("speaker_id", userId)
    .eq("status", "accepted")

  const conferenceIds = [...new Set((affs ?? []).map((a) => a.event_id as string))]
  if (conferenceIds.length === 0) return []

  // 2) Conferences + their paying subscription + organizer profile.
  const { data: confs } = await admin
    .from("conferences")
    .select("id, name, user_id, subscription_id")
    .in("id", conferenceIds)

  const conferences = confs ?? []
  if (conferences.length === 0) return []

  const subIds = conferences.map((c) => c.subscription_id).filter(Boolean) as string[]
  const organizerIds = [...new Set(conferences.map((c) => c.user_id as string))]

  const [{ data: subs }, { data: organizers }, { data: days }] = await Promise.all([
    subIds.length
      ? admin
          .from("organizer_subscriptions")
          .select("id, event_start, event_end, status")
          .in("id", subIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    admin.from("speakers").select("user_id, name, display_name").in("user_id", organizerIds),
    admin.from("conference_days").select("id, conference_id, label, date").in("conference_id", conferenceIds),
  ])

  const subById = new Map((subs ?? []).map((s) => [s.id as string, s]))
  const organizerById = new Map((organizers ?? []).map((o) => [o.user_id as string, o]))
  const dayById = new Map((days ?? []).map((d) => [d.id as string, d]))
  const confById = new Map(conferences.map((c) => [c.id as string, c]))

  const dayIds = (days ?? []).map((d) => d.id as string)
  if (dayIds.length === 0) return []

  // 3) This speaker's assigned slots within those days.
  const { data: slots } = await admin
    .from("conference_slots")
    .select("id, day_id, title, type, start_time, duration")
    .in("day_id", dayIds)
    .eq("speaker_id", userId)
    .order("start_time", { ascending: true })

  const result: SpeakerConferenceTalk[] = []
  for (const slot of slots ?? []) {
    const day = dayById.get(slot.day_id as string)
    if (!day) continue
    const conf = confById.get(day.conference_id as string)
    if (!conf) continue
    const sub = conf.subscription_id ? subById.get(conf.subscription_id as string) : null
    const organizer = organizerById.get(conf.user_id as string)

    result.push({
      slotId: slot.id as string,
      title: slot.title as string,
      type: slot.type as string,
      startTime: (slot.start_time as string | null) ?? null,
      duration: (slot.duration as number) ?? 0,
      dayLabel: (day.label as string) ?? "",
      dayDate: (day.date as string | null) ?? null,
      conferenceId: conf.id as string,
      conferenceName: (conf.name as string) ?? "",
      organizerName:
        (organizer?.display_name as string) || (organizer?.name as string) || "Organizer",
      eventStart: (sub?.event_start as string | null) ?? null,
      eventEnd: (sub?.event_end as string | null) ?? null,
      subStatus: (sub?.status as string | null) ?? null,
    })
  }

  return result
}

/**
 * Called after a user signs in/up. Links any pending affiliations + slots that
 * were invited by email to the now-existing account, flipping pending → accepted.
 */
export async function linkAffiliationsOnSignup(userId: string, email: string): Promise<void> {
  const admin = createAdminClient()
  const normalized = email.trim().toLowerCase()

  const { data: affs } = await admin
    .from("event_speaker_affiliations")
    .select("id, event_id, status")
    .ilike("email", normalized)

  if (!affs || affs.length === 0) return

  // Accept pending invites; attach the user id on all matching rows.
  await admin
    .from("event_speaker_affiliations")
    .update({ speaker_id: userId, status: "accepted" })
    .ilike("email", normalized)
    .eq("status", "pending")

  await admin
    .from("event_speaker_affiliations")
    .update({ speaker_id: userId })
    .ilike("email", normalized)
    .neq("status", "revoked")

  // Attach the user id to any slots invited by this email.
  await admin
    .from("conference_slots")
    .update({ speaker_id: userId })
    .ilike("speaker_email", normalized)
}
