"use server"

import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { CfpQuestionType, CfpStatus } from "@/lib/cfp"
import { createUnscheduledSlotForSubmission } from "@/lib/cfp"
import {
  sendEmail,
  cfpAcceptEmail,
  cfpRejectEmail,
  cfpWaitlistEmail,
} from "@/lib/email"

// ─── Ownership guard ──────────────────────────────────────────────────────────

/** Verifies the current user owns the conference (RLS-scoped read). Throws if not. */
async function requireConferenceOwner(
  supabase: SupabaseClient,
  conferenceId: string,
): Promise<string> {
  const user = await requireAuth()
  const { data } = await supabase
    .from("conferences")
    .select("id")
    .eq("id", conferenceId)
    .maybeSingle()
  if (!data) throw new Error("Conference not found.")
  return user.id
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

// ─── CFP settings ───────────────────────────────────────────────────────────

export interface CfpSettingsInput {
  isOpen: boolean
  opensAt: string | null
  closesAt: string | null
  title: string
  description: string | null
  maxSubmissionsPerEmail: number
}

/**
 * Create the CFP row for a conference if missing, generating a unique public
 * slug from the conference name. Idempotent — returns the existing row's slug.
 */
export async function ensureCfpSettings(conferenceId: string): Promise<void> {
  const supabase = await createClient()
  await requireConferenceOwner(supabase, conferenceId)

  const { data: existing } = await supabase
    .from("cfp_settings")
    .select("id")
    .eq("conference_id", conferenceId)
    .maybeSingle()
  if (existing) return

  const { data: conf } = await supabase
    .from("conferences")
    .select("name")
    .eq("id", conferenceId)
    .maybeSingle()

  const base = slugify((conf?.name as string) ?? "cfp") || "cfp"
  // Ensure uniqueness with a short random suffix; slug has a unique constraint.
  const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`

  await supabase.from("cfp_settings").insert({
    conference_id: conferenceId,
    slug,
    is_open: false,
    title: "Call for Papers",
  })
  revalidatePath(`/dashboard/conference/${conferenceId}/cfp`)
}

export async function updateCfpSettings(
  conferenceId: string,
  input: CfpSettingsInput,
): Promise<void> {
  const supabase = await createClient()
  await requireConferenceOwner(supabase, conferenceId)

  const { error } = await supabase
    .from("cfp_settings")
    .update({
      is_open: input.isOpen,
      opens_at: input.opensAt,
      closes_at: input.closesAt,
      title: input.title.trim() || "Call for Papers",
      description: input.description?.trim() || null,
      max_submissions_per_email: Math.max(1, Math.min(20, input.maxSubmissionsPerEmail || 3)),
      updated_at: new Date().toISOString(),
    })
    .eq("conference_id", conferenceId)

  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/conference/${conferenceId}/cfp`)
}

// ─── Custom questions ─────────────────────────────────────────────────────────

export interface QuestionInput {
  label: string
  type: CfpQuestionType
  options: string[] | null
  required: boolean
}

export async function addCfpQuestion(
  conferenceId: string,
  input: QuestionInput,
): Promise<void> {
  const supabase = await createClient()
  await requireConferenceOwner(supabase, conferenceId)

  const { count } = await supabase
    .from("cfp_custom_questions")
    .select("id", { count: "exact", head: true })
    .eq("conference_id", conferenceId)

  const { error } = await supabase.from("cfp_custom_questions").insert({
    conference_id: conferenceId,
    label: input.label.trim(),
    type: input.type,
    options: needsOptions(input.type) ? (input.options ?? []) : null,
    required: input.required,
    sort_order: count ?? 0,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/conference/${conferenceId}/cfp`)
}

export async function deleteCfpQuestion(
  conferenceId: string,
  questionId: string,
): Promise<void> {
  const supabase = await createClient()
  await requireConferenceOwner(supabase, conferenceId)
  await supabase.from("cfp_custom_questions").delete().eq("id", questionId)
  revalidatePath(`/dashboard/conference/${conferenceId}/cfp`)
}

function needsOptions(type: CfpQuestionType): boolean {
  return type === "select" || type === "multi_select"
}

// ─── Review actions ───────────────────────────────────────────────────────────

export async function setCfpReview(
  conferenceId: string,
  submissionId: string,
  patch: { rating?: number | null; reviewerNotes?: string | null },
): Promise<void> {
  const supabase = await createClient()
  await requireConferenceOwner(supabase, conferenceId)
  await supabase
    .from("cfp_submissions")
    .update({
      ...(patch.rating !== undefined ? { rating: patch.rating } : {}),
      ...(patch.reviewerNotes !== undefined ? { reviewer_notes: patch.reviewerNotes } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId)
    .eq("conference_id", conferenceId)
  revalidatePath(`/dashboard/conference/${conferenceId}/cfp/review`)
}

export interface DecisionResult {
  ok: boolean
  emailSent: boolean
}

/**
 * Decide a submission (accept / reject / waitlist), send the matching email,
 * and — on accept — create an unscheduled slot + pending/accepted affiliation.
 */
export async function decideCfpSubmission(
  conferenceId: string,
  submissionId: string,
  decision: Extract<CfpStatus, "accepted" | "rejected" | "waitlisted">,
): Promise<DecisionResult> {
  const supabase = await createClient()
  const userId = await requireConferenceOwner(supabase, conferenceId)

  const { data: sub } = await supabase
    .from("cfp_submissions")
    .select("id, name, email, title, status")
    .eq("id", submissionId)
    .eq("conference_id", conferenceId)
    .maybeSingle()
  if (!sub) throw new Error("Submission not found.")

  const { data: conf } = await supabase
    .from("conferences")
    .select("name")
    .eq("id", conferenceId)
    .maybeSingle()
  const conferenceName = (conf?.name as string) ?? "the conference"

  let slotId: string | null = null
  let hasAccount = false

  if (decision === "accepted") {
    const res = await createUnscheduledSlotForSubmission({
      conferenceId,
      title: sub.title as string,
      email: sub.email as string,
      invitedBy: userId,
    })
    slotId = res.slotId
    hasAccount = res.hasAccount
  }

  await supabase
    .from("cfp_submissions")
    .update({
      status: decision,
      slot_id: slotId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId)
    .eq("conference_id", conferenceId)

  // Build + send the decision email (never throws).
  const origin = process.env.NEXT_PUBLIC_SITE_URL || ""
  let tpl: { subject: string; html: string }
  if (decision === "accepted") {
    tpl = cfpAcceptEmail({
      speakerName: sub.name as string,
      talkTitle: sub.title as string,
      conferenceName,
      signupUrl: `${origin}/${hasAccount ? "dashboard" : "signup"}`,
      hasAccount,
    })
  } else if (decision === "waitlisted") {
    tpl = cfpWaitlistEmail({
      speakerName: sub.name as string,
      talkTitle: sub.title as string,
      conferenceName,
    })
  } else {
    tpl = cfpRejectEmail({
      speakerName: sub.name as string,
      talkTitle: sub.title as string,
      conferenceName,
    })
  }

  const mail = await sendEmail({ to: (sub.email as string).toLowerCase(), ...tpl })

  revalidatePath(`/dashboard/conference/${conferenceId}/cfp/review`)
  return { ok: true, emailSent: mail.sent }
}
