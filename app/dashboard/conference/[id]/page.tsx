import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import {
  getConferenceById,
  getConferenceDays,
  getSlotsForDays,
  getOrganizerSubscriptions,
} from "@/lib/db"
import { computeOrganizerAccess, type OrganizerSubscription } from "@/lib/billing"
import { ConferenceEditor } from "@/components/conference/conference-editor"

export default async function ConferenceSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth()
  const { id } = await params
  const supabase = await createClient()

  const conference = await getConferenceById(supabase, id)
  if (!conference) notFound()

  const [days, subsRaw] = await Promise.all([
    getConferenceDays(supabase, id),
    getOrganizerSubscriptions(supabase),
  ])
  const slots = await getSlotsForDays(
    supabase,
    days.map((d) => d.id),
  )
  const access = computeOrganizerAccess(subsRaw as unknown as OrganizerSubscription[])

  // Build a map of slotId -> assignment for display, using the affiliation
  // status for the slot's invited email.
  const { data: affiliations } = await supabase
    .from("event_speaker_affiliations")
    .select("email, status")
    .eq("event_id", id)
  const statusByEmail = new Map<string, string>(
    (affiliations ?? []).map((a) => [String(a.email).toLowerCase(), String(a.status)]),
  )
  const assignmentsBySlot: Record<string, { email: string; status: string }> = {}
  for (const slot of slots) {
    if (slot.speaker_email) {
      const key = slot.speaker_email.toLowerCase()
      assignmentsBySlot[slot.id] = {
        email: slot.speaker_email,
        status: statusByEmail.get(key) ?? "pending",
      }
    }
  }

  return (
    <ConferenceEditor
      conference={conference}
      initialDays={days}
      initialSlots={slots}
      accessLevel={access.level}
      eventStart={access.eventStart}
      eventEnd={access.eventEnd}
      assignmentsBySlot={assignmentsBySlot}
    />
  )
}
