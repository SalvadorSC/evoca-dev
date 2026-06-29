import { NextResponse, type NextRequest } from "next/server"
import { requireAuth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

/** A live question coming from the PartyKit state. */
interface IncomingQuestion {
  id: string
  name?: string
  text: string
  votes?: number
  answered?: boolean
  ts?: number
}

/**
 * Persists the final Q&A of a session to Supabase so it shows up in the
 * speaker's dashboard history. Called by the presenter when ending a session.
 *
 * The `questions` table has RLS enabled with no policies, so we use the admin
 * client and gate every write behind an explicit talk-ownership check.
 */
export async function POST(req: NextRequest) {
  const user = await requireAuth()

  let body: { sessionId?: string; questions?: IncomingQuestion[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }

  const { sessionId, questions } = body
  if (!sessionId || !Array.isArray(questions)) {
    return NextResponse.json({ error: "sessionId and questions are required." }, { status: 400 })
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

  // Replace any prior snapshot for this session (idempotent on re-end).
  await admin.from("questions").delete().eq("session_id", sessionId)

  if (questions.length > 0) {
    const rows = questions.map((q) => ({
      session_id: sessionId,
      text: q.text,
      author_name: q.name?.trim() || null,
      votes: typeof q.votes === "number" ? q.votes : 0,
      answered: Boolean(q.answered),
      created_at: q.ts ? new Date(q.ts).toISOString() : new Date().toISOString(),
    }))
    const { error: insertErr } = await admin.from("questions").insert(rows)
    if (insertErr) {
      console.error("[v0] snapshot-questions insert failed:", insertErr.message)
      return NextResponse.json({ error: "Failed to save questions." }, { status: 500 })
    }
  }

  // Keep the session's denormalized count in sync.
  await admin.from("sessions").update({ question_count: questions.length }).eq("id", sessionId)

  return NextResponse.json({ ok: true, saved: questions.length })
}
