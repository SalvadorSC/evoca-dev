import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Call for Papers logic (Phase 7).
 *
 * Public-facing reads (the submission page) and public inserts (a new
 * submission) use the service-role admin client because there are no anon RLS
 * policies — all four CFP tables are organizer-scoped. Every public path here
 * therefore validates by the public `slug` and never trusts a conference id
 * from the client.
 *
 * Organizer reads/writes go through the normal RLS client in server actions.
 */

export type CfpQuestionType =
  | "short_text"
  | "long_text"
  | "select"
  | "multi_select"
  | "checkbox"

export type CfpStatus =
  | "submitted"
  | "under_review"
  | "accepted"
  | "rejected"
  | "waitlisted"

export interface CfpCustomQuestion {
  id: string
  conferenceId: string
  label: string
  type: CfpQuestionType
  options: string[] | null
  required: boolean
  sortOrder: number
}

export interface CfpPublicView {
  conferenceId: string
  conferenceName: string
  slug: string
  title: string
  description: string | null
  isAcceptingSubmissions: boolean
  closedReason: "disabled" | "not_open_yet" | "closed" | null
  questions: CfpCustomQuestion[]
}

function mapQuestion(row: Record<string, unknown>): CfpCustomQuestion {
  return {
    id: row.id as string,
    conferenceId: row.conference_id as string,
    label: row.label as string,
    type: row.type as CfpQuestionType,
    options: (row.options as string[] | null) ?? null,
    required: Boolean(row.required),
    sortOrder: (row.sort_order as number) ?? 0,
  }
}

/**
 * Public view of a CFP by its slug. Returns null only when the slug doesn't
 * exist; a disabled/closed CFP still returns data with `isAcceptingSubmissions`
 * false so the page can render an informative closed state.
 */
export async function getCfpBySlug(slug: string): Promise<CfpPublicView | null> {
  const admin = createAdminClient()

  const { data: settings } = await admin
    .from("cfp_settings")
    .select("conference_id, slug, title, description, is_open, opens_at, closes_at")
    .eq("slug", slug)
    .maybeSingle()

  if (!settings) return null

  const { data: conf } = await admin
    .from("conferences")
    .select("name")
    .eq("id", settings.conference_id as string)
    .maybeSingle()

  const { data: questions } = await admin
    .from("cfp_custom_questions")
    .select("*")
    .eq("conference_id", settings.conference_id as string)
    .order("sort_order", { ascending: true })

  const now = Date.now()
  const opensAt = settings.opens_at ? new Date(settings.opens_at as string).getTime() : null
  const closesAt = settings.closes_at ? new Date(settings.closes_at as string).getTime() : null

  let closedReason: CfpPublicView["closedReason"] = null
  if (!settings.is_open) closedReason = "disabled"
  else if (opensAt && now < opensAt) closedReason = "not_open_yet"
  else if (closesAt && now > closesAt) closedReason = "closed"

  return {
    conferenceId: settings.conference_id as string,
    conferenceName: (conf?.name as string) ?? "Conference",
    slug: settings.slug as string,
    title: (settings.title as string) ?? "Call for Papers",
    description: (settings.description as string | null) ?? null,
    isAcceptingSubmissions: closedReason === null,
    closedReason,
    questions: (questions ?? []).map(mapQuestion),
  }
}

export interface SubmitProposalInput {
  slug: string
  name: string
  email: string
  title: string
  abstract: string
  talkFormat: string
  bio?: string
  answers: { questionId: string; value: unknown }[]
}

export type SubmitProposalResult =
  | { ok: true; conferenceName: string; speakerName: string; talkTitle: string; talkFormat: string }
  | { ok: false; error: string }

/**
 * Create a submission from the public page. Re-validates the window + per-email
 * cap server-side (never trusting the client), then stores the submission and
 * its custom answers.
 */
export async function submitProposal(input: SubmitProposalInput): Promise<SubmitProposalResult> {
  const admin = createAdminClient()
  const email = input.email.trim().toLowerCase()

  const { data: settings } = await admin
    .from("cfp_settings")
    .select("conference_id, is_open, opens_at, closes_at, max_submissions_per_email, conferences(name)")
    .eq("slug", input.slug)
    .maybeSingle()

  if (!settings) return { ok: false, error: "This call for papers no longer exists." }

  // `conferences` arrives as an object (or array, depending on the join shape).
  const confRel = settings.conferences as { name?: string } | { name?: string }[] | null
  const conferenceName =
    (Array.isArray(confRel) ? confRel[0]?.name : confRel?.name) ?? "the conference"

  const now = Date.now()
  const opensAt = settings.opens_at ? new Date(settings.opens_at as string).getTime() : null
  const closesAt = settings.closes_at ? new Date(settings.closes_at as string).getTime() : null
  if (!settings.is_open) return { ok: false, error: "This call for papers is not currently open." }
  if (opensAt && now < opensAt) return { ok: false, error: "This call for papers hasn't opened yet." }
  if (closesAt && now > closesAt) return { ok: false, error: "This call for papers has closed." }

  const conferenceId = settings.conference_id as string
  const cap = (settings.max_submissions_per_email as number) ?? 3

  const { count } = await admin
    .from("cfp_submissions")
    .select("id", { count: "exact", head: true })
    .eq("conference_id", conferenceId)
    .ilike("email", email)

  if ((count ?? 0) >= cap) {
    return { ok: false, error: `You've reached the maximum of ${cap} submissions for this event.` }
  }

  const { data: submission, error: insertErr } = await admin
    .from("cfp_submissions")
    .insert({
      conference_id: conferenceId,
      name: input.name.trim(),
      email,
      title: input.title.trim(),
      abstract: input.abstract.trim(),
      talk_format: input.talkFormat.trim() || "talk",
      bio: input.bio?.trim() || null,
      status: "submitted",
    })
    .select("id")
    .single()

  if (insertErr || !submission) {
    console.error("[v0] submitProposal insert error:", insertErr?.message)
    return { ok: false, error: "Something went wrong saving your submission. Please try again." }
  }

  if (input.answers.length > 0) {
    const rows = input.answers.map((a) => ({
      submission_id: submission.id,
      question_id: a.questionId,
      answer: a.value ?? null,
    }))
    await admin.from("cfp_submission_answers").insert(rows)
  }

  return {
    ok: true,
    conferenceName,
    speakerName: input.name.trim(),
    talkTitle: input.title.trim(),
    talkFormat: input.talkFormat.trim() || "talk",
  }
}

/**
 * Create an unscheduled slot for an accepted submission and link the speaker.
 * Mirrors the Phase 2 assignment model: a slot with a null start_time lives in
 * the organizer's "unscheduled" tray until dragged onto the timeline.
 * Returns the new slot id, or null if the conference has no day to attach to.
 */
export async function createUnscheduledSlotForSubmission(opts: {
  conferenceId: string
  title: string
  email: string
  invitedBy: string
}): Promise<{ slotId: string | null; status: "accepted" | "pending"; hasAccount: boolean }> {
  const admin = createAdminClient()
  const email = opts.email.trim().toLowerCase()

  // Resolve email -> existing account (immediate accept) or pending invite.
  const { data: speaker } = await admin
    .from("speakers")
    .select("user_id")
    .ilike("email", email)
    .limit(1)
    .maybeSingle()
  const userId = (speaker?.user_id as string | undefined) ?? null
  const hasAccount = userId !== null
  const status: "accepted" | "pending" = hasAccount ? "accepted" : "pending"

  // Find the first day (lowest sort_order) to host the unscheduled slot.
  const { data: day } = await admin
    .from("conference_days")
    .select("id")
    .eq("conference_id", opts.conferenceId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle()

  let slotId: string | null = null
  if (day) {
    const { data: slot } = await admin
      .from("conference_slots")
      .insert({
        day_id: day.id as string,
        title: opts.title.trim() || "Accepted talk",
        type: "talk",
        start_time: null, // unscheduled
        duration: 30,
        speaker_email: email,
        speaker_id: userId,
      })
      .select("id")
      .single()
    slotId = (slot?.id as string | undefined) ?? null
  }

  // Upsert the affiliation (resurrect revoked rows), keyed by (event, email).
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

  return { slotId, status, hasAccount }
}
