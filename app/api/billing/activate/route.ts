import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateEventWindow, ONE_TIME_MAX_DAYS } from "@/lib/billing"

export const dynamic = "force-dynamic"

interface Body {
  subscriptionId?: string
  activateNow?: boolean
  eventStart?: string
  eventEnd?: string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 })
  }

  // Find the target one-time subscription (explicit id, or the latest pending one).
  let query = supabase
    .from("organizer_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("plan", "organizer_onetime")

  if (body.subscriptionId) {
    query = query.eq("id", body.subscriptionId)
  } else {
    query = query.eq("status", "pending_activation")
  }

  const { data: rows } = await query.order("created_at", { ascending: false }).limit(1)
  const sub = rows?.[0]
  if (!sub) {
    return NextResponse.json({ error: "No event to activate." }, { status: 404 })
  }

  let start: string
  let end: string
  if (body.activateNow) {
    const s = new Date()
    const e = new Date(s.getTime() + ONE_TIME_MAX_DAYS * 86400000)
    start = s.toISOString()
    end = e.toISOString()
  } else if (body.eventStart && body.eventEnd) {
    const check = validateEventWindow(body.eventStart, body.eventEnd)
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 })
    start = new Date(body.eventStart).toISOString()
    end = new Date(body.eventEnd).toISOString()
  } else {
    return NextResponse.json({ error: "Provide dates or activateNow." }, { status: 400 })
  }

  // RLS: org_subs_update_own allows the owner to update their row.
  const { error } = await supabase
    .from("organizer_subscriptions")
    .update({
      status: "active",
      event_start: start,
      event_end: end,
      activated_at: new Date().toISOString(),
      expires_at: end,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sub.id)
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, eventStart: start, eventEnd: end })
}
