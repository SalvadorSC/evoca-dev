"use server"

import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import {
  computeOrganizerAccess,
  hasOrganizerPrep,
  MAX_CONFERENCE_DAYS,
  SLOT_TYPES,
  type OrganizerSubscription,
  type SlotType,
} from "@/lib/billing"
import { getOrganizerSubscriptions } from "@/lib/db"
import { normalizeDailymotion } from "@/lib/dailymotion"
import type { SupabaseClient } from "@supabase/supabase-js"

// ─── Access guard ───────────────────────────────────────────────────────────────

/**
 * Ensures the user has at least organizer "prep" access (a paid plan).
 * Throws if not — the UI gates this with the PaywallModal, this is the
 * server-side backstop.
 */
async function requireOrganizerPrep(supabase: SupabaseClient): Promise<string> {
  const user = await requireAuth()
  const subs = (await getOrganizerSubscriptions(supabase)) as unknown as OrganizerSubscription[]
  const access = computeOrganizerAccess(subs)
  if (!hasOrganizerPrep(access)) {
    throw new Error("An organizer plan is required to manage conferences.")
  }
  return user.id
}

/** Returns the active subscription id that should pay for a new conference. */
function pickSubscriptionId(subs: OrganizerSubscription[]): string | null {
  const access = computeOrganizerAccess(subs)
  return access.subscriptionId
}

// ─── Conference CRUD ──────────────────────────────────────────────────────────

export async function createConference(name: string): Promise<string> {
  const supabase = await createClient()
  const userId = await requireOrganizerPrep(supabase)

  const trimmed = name.trim()
  if (!trimmed) throw new Error("Conference name is required.")

  const subs = (await getOrganizerSubscriptions(supabase)) as unknown as OrganizerSubscription[]
  const subscriptionId = pickSubscriptionId(subs)

  const { data, error } = await supabase
    .from("conferences")
    .insert({ user_id: userId, name: trimmed, subscription_id: subscriptionId })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  // Seed with a first day so the schedule page isn't empty.
  await supabase
    .from("conference_days")
    .insert({ conference_id: data.id, label: "Day 1", sort_order: 0 })

  revalidatePath("/dashboard/conference")
  return data.id as string
}

export async function renameConference(id: string, name: string): Promise<void> {
  const supabase = await createClient()
  await requireOrganizerPrep(supabase)
  const trimmed = name.trim()
  if (!trimmed) throw new Error("Conference name is required.")

  const { error } = await supabase
    .from("conferences")
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/conference/${id}`)
}

export async function deleteConference(id: string): Promise<void> {
  const supabase = await createClient()
  await requireOrganizerPrep(supabase)
  const { error } = await supabase.from("conferences").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/conference")
}

// ─── Day CRUD ─────────────────────────────────────────────────────────────────

export async function addDay(conferenceId: string): Promise<void> {
  const supabase = await createClient()
  await requireOrganizerPrep(supabase)

  const { data: existing } = await supabase
    .from("conference_days")
    .select("id, sort_order")
    .eq("conference_id", conferenceId)
    .order("sort_order", { ascending: false })

  const days = existing ?? []
  if (days.length >= MAX_CONFERENCE_DAYS) {
    throw new Error(`A conference can have at most ${MAX_CONFERENCE_DAYS} days.`)
  }

  const nextOrder = days.length > 0 ? (days[0].sort_order as number) + 1 : 0
  const { error } = await supabase.from("conference_days").insert({
    conference_id: conferenceId,
    label: `Day ${days.length + 1}`,
    sort_order: nextOrder,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/conference/${conferenceId}`)
}

export async function renameDay(
  conferenceId: string,
  dayId: string,
  label: string,
): Promise<void> {
  const supabase = await createClient()
  await requireOrganizerPrep(supabase)
  const trimmed = label.trim()
  if (!trimmed) throw new Error("Day label is required.")
  const { error } = await supabase
    .from("conference_days")
    .update({ label: trimmed })
    .eq("id", dayId)
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/conference/${conferenceId}`)
}

export async function setDayDate(
  conferenceId: string,
  dayId: string,
  date: string | null,
): Promise<void> {
  const supabase = await createClient()
  await requireOrganizerPrep(supabase)
  const { error } = await supabase
    .from("conference_days")
    .update({ date })
    .eq("id", dayId)
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/conference/${conferenceId}`)
}

export async function deleteDay(conferenceId: string, dayId: string): Promise<void> {
  const supabase = await createClient()
  await requireOrganizerPrep(supabase)
  const { error } = await supabase.from("conference_days").delete().eq("id", dayId)
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/conference/${conferenceId}`)
}

// ─── Slot CRUD ────────────────────────────────────────────────────────────────

export interface SlotInput {
  title: string
  type: SlotType
  start_time?: string | null
  duration?: number
  description?: string | null
  track?: string | null
}

function validateSlot(input: SlotInput) {
  if (!input.title.trim()) throw new Error("Slot title is required.")
  if (!SLOT_TYPES.includes(input.type)) throw new Error("Invalid slot type.")
  if (input.duration != null && (input.duration < 5 || input.duration > 600)) {
    throw new Error("Duration must be between 5 and 600 minutes.")
  }
}

export async function addSlot(
  conferenceId: string,
  dayId: string,
  input: SlotInput,
): Promise<void> {
  const supabase = await createClient()
  await requireOrganizerPrep(supabase)
  validateSlot(input)

  const { data: existing } = await supabase
    .from("conference_slots")
    .select("sort_order")
    .eq("day_id", dayId)
    .order("sort_order", { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? (existing[0].sort_order as number) + 1 : 0

  const { error } = await supabase.from("conference_slots").insert({
    day_id: dayId,
    title: input.title.trim(),
    type: input.type,
    start_time: input.start_time ?? null,
    duration: input.duration ?? 30,
    description: input.description?.trim() || null,
    track: input.track?.trim() || null,
    sort_order: nextOrder,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/conference/${conferenceId}`)
}

export async function updateSlot(
  conferenceId: string,
  slotId: string,
  input: SlotInput,
): Promise<void> {
  const supabase = await createClient()
  await requireOrganizerPrep(supabase)
  validateSlot(input)

  const { error } = await supabase
    .from("conference_slots")
    .update({
      title: input.title.trim(),
      type: input.type,
      start_time: input.start_time ?? null,
      duration: input.duration ?? 30,
      description: input.description?.trim() || null,
      track: input.track?.trim() || null,
    })
    .eq("id", slotId)
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/conference/${conferenceId}`)
}

/** Move/resize a slot — updates start_time, duration, and/or sort_order. */
export async function moveSlot(
  conferenceId: string,
  slotId: string,
  patch: { start_time?: string | null; duration?: number; sort_order?: number; day_id?: string },
): Promise<void> {
  const supabase = await createClient()
  await requireOrganizerPrep(supabase)
  const { error } = await supabase.from("conference_slots").update(patch).eq("id", slotId)
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/conference/${conferenceId}`)
}

export async function deleteSlot(conferenceId: string, slotId: string): Promise<void> {
  const supabase = await createClient()
  await requireOrganizerPrep(supabase)
  const { error } = await supabase.from("conference_slots").delete().eq("id", slotId)
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/conference/${conferenceId}`)
}

// ─── Stream CRUD (Phase 3 — public page / live streams) ─────────────────────────

export interface StreamInput {
  label: string
  track?: string | null
  /** Raw pasted Dailymotion URL or video id. */
  source: string
}

/** Create or update a stream. Pass `streamId` to update an existing row. */
export async function upsertStream(
  conferenceId: string,
  input: StreamInput,
  streamId?: string,
): Promise<void> {
  const supabase = await createClient()
  await requireOrganizerPrep(supabase)

  const label = input.label.trim()
  if (!label) throw new Error("Stream label is required.")

  const normalized = normalizeDailymotion(input.source)
  if (!normalized) {
    throw new Error("Enter a valid Dailymotion video URL or id (e.g. dailymotion.com/video/x8abc12).")
  }

  const payload = {
    label,
    track: input.track?.trim() || null,
    embed_url: normalized.embedUrl,
    video_id: normalized.videoId,
    provider: "dailymotion",
  }

  if (streamId) {
    const { error } = await supabase
      .from("conference_streams")
      .update(payload)
      .eq("id", streamId)
    if (error) throw new Error(error.message)
  } else {
    const { data: existing } = await supabase
      .from("conference_streams")
      .select("sort_order")
      .eq("conference_id", conferenceId)
      .order("sort_order", { ascending: false })
      .limit(1)
    const nextOrder = existing && existing.length > 0 ? (existing[0].sort_order as number) + 1 : 0
    const { error } = await supabase
      .from("conference_streams")
      .insert({ conference_id: conferenceId, ...payload, sort_order: nextOrder })
    if (error) throw new Error(error.message)
  }
  revalidatePath(`/dashboard/conference/${conferenceId}`)
}

export async function deleteStream(conferenceId: string, streamId: string): Promise<void> {
  const supabase = await createClient()
  await requireOrganizerPrep(supabase)
  const { error } = await supabase.from("conference_streams").delete().eq("id", streamId)
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/conference/${conferenceId}`)
}

/** Mark one stream as the featured/main feed (clears the flag on the rest). */
export async function setFeaturedStream(
  conferenceId: string,
  streamId: string,
): Promise<void> {
  const supabase = await createClient()
  await requireOrganizerPrep(supabase)

  const { error: clearErr } = await supabase
    .from("conference_streams")
    .update({ is_featured: false })
    .eq("conference_id", conferenceId)
  if (clearErr) throw new Error(clearErr.message)

  const { error } = await supabase
    .from("conference_streams")
    .update({ is_featured: true })
    .eq("id", streamId)
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/conference/${conferenceId}`)
}

// ─── Publishing ─────────────────────────────────────────────────────────────────

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

/**
 * Publish or unpublish a conference. On first publish, generates a unique slug
 * from the name (suffixing a short random token on collision).
 */
export async function setConferencePublished(
  conferenceId: string,
  isPublic: boolean,
): Promise<{ slug: string | null }> {
  const supabase = await createClient()
  await requireOrganizerPrep(supabase)

  const { data: conf, error: fetchErr } = await supabase
    .from("conferences")
    .select("id, name, slug")
    .eq("id", conferenceId)
    .single()
  if (fetchErr) throw new Error(fetchErr.message)

  let slug: string | null = (conf?.slug as string | null) ?? null

  if (isPublic && !slug) {
    const base = slugify(conf.name as string) || "conference"
    slug = base
    // Resolve collisions by appending a short random suffix.
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: clash } = await supabase
        .from("conferences")
        .select("id")
        .eq("slug", slug)
        .neq("id", conferenceId)
        .maybeSingle()
      if (!clash) break
      slug = `${base}-${Math.random().toString(36).slice(2, 6)}`
    }
  }

  const { error } = await supabase
    .from("conferences")
    .update({ is_public: isPublic, slug, updated_at: new Date().toISOString() })
    .eq("id", conferenceId)
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/conference/${conferenceId}`)
  if (slug) revalidatePath(`/c/${slug}`)
  return { slug }
}
