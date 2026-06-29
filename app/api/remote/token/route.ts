import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { mintRemoteToken } from "@/lib/remote-token"

export const dynamic = "force-dynamic"

/**
 * GET /api/remote/token?sessionId=...
 *
 * Called by the presenter (authenticated) to mint a phone-remote token for one
 * of their own live sessions. Verifies the session's talk belongs to the
 * caller before issuing the token.
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("sessionId")
  if (!sessionId) {
    return NextResponse.json({ error: "missing sessionId" }, { status: 400 })
  }

  // Resolve the session → talk → owner, and the partykit room. Use the admin
  // client so we can verify ownership regardless of RLS, then enforce it here.
  const admin = createAdminClient()
  const { data: session } = await admin
    .from("sessions")
    .select("id, partykit_room, status, talks(user_id)")
    .eq("id", sessionId)
    .maybeSingle()

  if (!session) {
    return NextResponse.json({ error: "session not found" }, { status: 404 })
  }

  const talk = session.talks as unknown as { user_id: string } | { user_id: string }[] | null
  const ownerId = Array.isArray(talk) ? talk[0]?.user_id : talk?.user_id
  if (ownerId !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const room = session.partykit_room as string
  const token = await mintRemoteToken({ userId: user.id, sessionId, room })

  const origin = new URL(request.url).origin
  const url = `${origin}/remote/${token}`

  return NextResponse.json({ token, url })
}
