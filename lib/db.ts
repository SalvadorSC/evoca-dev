/**
 * lib/db.ts — Typed query helpers
 *
 * Wraps common Supabase queries so raw query strings are never duplicated
 * across pages. Schema changes only need to be updated here.
 *
 * Server-side helpers accept a `supabase` client so the caller controls
 * auth context (server vs. browser). Client-side helpers create their own
 * browser client.
 */

import type { SupabaseClient } from "@supabase/supabase-js"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TalkRow {
  id: string
  title: string
  slug: string
  description: string | null
  slide_url: string | null
  slide_type: string | null
  created_at: string
}

export interface SessionRow {
  id: string
  talk_id: string
  partykit_room: string
  scheduled_at: string
  ended_at: string | null
  status: "active" | "finished"
  allow_reactions: boolean
  allow_text_reactions: boolean
  allow_questions: boolean
  show_watermark: boolean
}

export interface SessionWithTalk extends SessionRow {
  talks: Pick<TalkRow, "id" | "title" | "slide_url" | "slide_type">
}

// ─── Conference types (Phase 2) ─────────────────────────────────────────────────

export interface ConferenceRow {
  id: string
  user_id: string
  subscription_id: string | null
  name: string
  created_at: string
  updated_at: string
}

export interface ConferenceDayRow {
  id: string
  conference_id: string
  label: string
  date: string | null
  sort_order: number
  created_at: string
}

export interface ConferenceSlotRow {
  id: string
  day_id: string
  title: string
  type: string
  start_time: string | null
  duration: number
  description: string | null
  speaker_id: string | null
  speaker_email: string | null
  track: string | null
  sort_order: number
  created_at: string
}

// ─── Talk queries ─────────────────────────────────────────────────────────────

/** Fetch a single talk by slug. Returns null if not found. */
export async function getTalkBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<TalkRow | null> {
  const { data } = await supabase
    .from("talks")
    .select("id, title, slug, description, slide_url, slide_type, created_at")
    .eq("slug", slug)
    .single()
  return data ?? null
}

/** Fetch all talks for the authenticated user. */
export async function getUserTalks(
  supabase: SupabaseClient,
): Promise<Pick<TalkRow, "id" | "title" | "slug" | "created_at">[]> {
  const { data } = await supabase
    .from("talks")
    .select("id, title, slug, created_at")
    .order("created_at", { ascending: false })
  return data ?? []
}

// ─── Session queries ──────────────────────────────────────────────────────────

/** Fetch a session by id, including its parent talk data. */
export async function getSessionById(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<SessionWithTalk | null> {
  const { data } = await supabase
    .from("sessions")
    .select(
      "id, talk_id, partykit_room, scheduled_at, ended_at, status, allow_reactions, allow_text_reactions, allow_questions, show_watermark, talks(id, title, slide_url, slide_type)",
    )
    .eq("id", sessionId)
    .single()
  return (data as SessionWithTalk | null) ?? null
}

/** Fetch the partykit_room name for a session by id. */
export async function getSessionRoom(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("sessions")
    .select("partykit_room")
    .eq("id", sessionId)
    .single()
  return data?.partykit_room ?? null
}

/** Fetch all sessions for a list of talk ids. */
export async function getSessionsForTalks(
  supabase: SupabaseClient,
  talkIds: string[],
): Promise<Pick<SessionRow, "id" | "talk_id" | "scheduled_at">[]> {
  if (talkIds.length === 0) return []
  const { data } = await supabase
    .from("sessions")
    .select("id, talk_id, scheduled_at")
    .in("talk_id", talkIds)
    .order("scheduled_at", { ascending: false })
  return data ?? []
}

/** Mark a session as finished. */
export async function finishSession(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<void> {
  await supabase
    .from("sessions")
    .update({ ended_at: new Date().toISOString(), status: "finished" })
    .eq("id", sessionId)
}

// ─── Billing queries ────────────────────────────────────────────────────────────

/** Fetch all organizer subscriptions for the authenticated user. */
export async function getOrganizerSubscriptions(
  supabase: SupabaseClient,
): Promise<Record<string, unknown>[]> {
  const { data } = await supabase.from("organizer_subscriptions").select("*")
  return data ?? []
}

// ─── Conference queries (Phase 2) ───────────────────────────────────────────────

/** Fetch all conferences for the authenticated user. */
export async function getUserConferences(
  supabase: SupabaseClient,
): Promise<ConferenceRow[]> {
  const { data } = await supabase
    .from("conferences")
    .select("id, user_id, subscription_id, name, created_at, updated_at")
    .order("created_at", { ascending: false })
  return data ?? []
}

/** Fetch a single conference by id (RLS scopes to owner). */
export async function getConferenceById(
  supabase: SupabaseClient,
  id: string,
): Promise<ConferenceRow | null> {
  const { data } = await supabase
    .from("conferences")
    .select("id, user_id, subscription_id, name, created_at, updated_at")
    .eq("id", id)
    .single()
  return data ?? null
}

/** Fetch days for a conference, ordered. */
export async function getConferenceDays(
  supabase: SupabaseClient,
  conferenceId: string,
): Promise<ConferenceDayRow[]> {
  const { data } = await supabase
    .from("conference_days")
    .select("id, conference_id, label, date, sort_order, created_at")
    .eq("conference_id", conferenceId)
    .order("sort_order", { ascending: true })
  return data ?? []
}

/** Fetch all slots for a set of day ids, ordered by sort_order. */
export async function getSlotsForDays(
  supabase: SupabaseClient,
  dayIds: string[],
): Promise<ConferenceSlotRow[]> {
  if (dayIds.length === 0) return []
  const { data } = await supabase
    .from("conference_slots")
    .select(
      "id, day_id, title, type, start_time, duration, description, speaker_id, speaker_email, track, sort_order, created_at",
    )
    .in("day_id", dayIds)
    .order("sort_order", { ascending: true })
  return data ?? []
}
