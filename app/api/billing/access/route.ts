import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { computeOrganizerAccess, type OrganizerSubscription } from "@/lib/billing"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { authenticated: false, access: { level: "none" } },
      { status: 200 },
    )
  }

  const { data } = await supabase
    .from("organizer_subscriptions")
    .select("*")
    .eq("user_id", user.id)

  const access = computeOrganizerAccess((data ?? []) as OrganizerSubscription[])

  return NextResponse.json({ authenticated: true, access })
}
