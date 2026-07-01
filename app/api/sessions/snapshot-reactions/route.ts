import { NextResponse, type NextRequest } from "next/server"
import { requireAuth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

/**
 * Persists the final reaction count (and optional per-emoji breakdown) for a
 * session to Supabase so it appears in the speaker's dashboard history.
 * Called by the presenter page when ending a session, mirroring the pattern
 * used by snapshot-questions.
 */
export async function POST(req: NextRequest) {
  const user = await requireAuth()

  let body: { sessionId?: string; reactionCount?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }

  const { sessionId, reactionCount } = body
  if (!sessionId || typeof reactionCount !== "number") {
    return NextResponse.json(
      { error: "sessionId and reactionCount are required." },
      { status: 400 },
    )
  }

  const admin = createAdminClient()

  // Verify the caller owns the talk behind this session.
  const { data: session, error: sessionErr } = await admin
    .from("sessions")
    .select("id, talks(user_id)")
    .eq("id", sessionId)
    .maybeSingle()

  if (sessionErr || !session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 })
  }

  const talkRel = (session as { talks?: { user_id?: string } | { user_id?: string }[] }).talks
  const ownerId = Array.isArray(talkRel) ? talkRel[0]?.user_id : talkRel?.user_id
  if (ownerId !== user.id) {
    return NextResponse.json({ error: "Not authorized for this session." }, { status: 403 })
  }

  const { error } = await admin
    .from("sessions")
    .update({ reaction_count: reactionCount })
    .eq("id", sessionId)

  if (error) {
    console.error("[v0] snapshot-reactions update failed:", error.message)
    return NextResponse.json({ error: "Failed to save reaction count." }, { status: 500 })
  }

  return NextResponse.json({ ok: true, reactionCount })
}
