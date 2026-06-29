import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  getPublicConferenceBySlug,
  getConferenceDays,
  getSlotsForDays,
  getConferenceStreams,
} from "@/lib/db"
import { PublicConferenceView } from "@/components/conference/public-conference-view"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const conference = await getPublicConferenceBySlug(supabase, slug)
  if (!conference) return { title: "Conference not found" }
  return {
    title: `${conference.name} — Live`,
    description: `Watch ${conference.name} live and follow the schedule.`,
  }
}

export default async function PublicConferencePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Anonymous client — RLS limits reads to published conferences only.
  const conference = await getPublicConferenceBySlug(supabase, slug)
  if (!conference) notFound()

  const [days, streams] = await Promise.all([
    getConferenceDays(supabase, conference.id),
    getConferenceStreams(supabase, conference.id),
  ])
  const slots = await getSlotsForDays(
    supabase,
    days.map((d) => d.id),
  )

  return (
    <PublicConferenceView
      conference={conference}
      days={days}
      slots={slots}
      streams={streams}
    />
  )
}
