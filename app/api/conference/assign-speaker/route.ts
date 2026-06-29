import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  assignSpeakerToSlot,
  unassignSpeakerFromSlot,
} from "@/lib/affiliations"
import { sendEmail, speakerInviteEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

function siteUrl(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  let body: {
    action?: "assign" | "unassign"
    conferenceId?: string
    slotId?: string
    email?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const { action, conferenceId, slotId, email } = body
  if (!conferenceId || !slotId) {
    return NextResponse.json({ error: "Missing conferenceId or slotId." }, { status: 400 })
  }

  // Verify the requester owns this conference (RLS scopes the read to owner).
  const { data: conf } = await supabase
    .from("conferences")
    .select("id")
    .eq("id", conferenceId)
    .maybeSingle()
  if (!conf) {
    return NextResponse.json({ error: "Conference not found." }, { status: 404 })
  }

  // Verify the slot belongs to a day of this conference.
  const { data: slotCheck } = await supabase
    .from("conference_slots")
    .select("id, conference_days!inner(conference_id)")
    .eq("id", slotId)
    .maybeSingle()
  const slotConfId = (
    slotCheck as { conference_days?: { conference_id?: string } } | null
  )?.conference_days?.conference_id
  if (!slotCheck || slotConfId !== conferenceId) {
    return NextResponse.json({ error: "Slot does not belong to this conference." }, { status: 400 })
  }

  try {
    if (action === "unassign") {
      await unassignSpeakerFromSlot({ conferenceId, slotId })
      return NextResponse.json({ ok: true, action: "unassign" })
    }

    if (!email || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 })
    }

    const result = await assignSpeakerToSlot({
      conferenceId,
      slotId,
      email,
      invitedBy: user.id,
    })

    // Notify the speaker they've been added (Phase 7 backfill of the stub).
    try {
      const [{ data: confRow }, { data: slotRow }] = await Promise.all([
        supabase.from("conferences").select("name").eq("id", conferenceId).maybeSingle(),
        supabase.from("conference_slots").select("title").eq("id", slotId).maybeSingle(),
      ])
      const { subject, html } = speakerInviteEmail({
        talkTitle: (slotRow?.title as string | null) ?? null,
        conferenceName: (confRow?.name as string) ?? "the conference",
        signupUrl: `${siteUrl(req)}/${result.hasAccount ? "dashboard" : "signup"}`,
        hasAccount: result.hasAccount,
      })
      await sendEmail({ to: email.trim().toLowerCase(), subject, html })
    } catch (mailErr) {
      // Email failure must not fail the assignment.
      console.error("[v0] invite email failed:", (mailErr as Error).message)
    }

    return NextResponse.json({ ok: true, action: "assign", ...result })
  } catch (err) {
    console.error("[v0] assign-speaker error:", (err as Error).message)
    return NextResponse.json({ error: "Could not update assignment." }, { status: 500 })
  }
}
