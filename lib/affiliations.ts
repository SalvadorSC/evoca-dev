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
