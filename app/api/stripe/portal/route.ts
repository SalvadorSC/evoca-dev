import { NextResponse, type NextRequest } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  const { data: speaker } = await supabase
    .from("speakers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!speaker?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account found." }, { status: 400 })
  }

  const h = await headers()
  const origin = h.get("origin") ?? new URL(req.url).origin

  const portal = await stripe.billingPortal.sessions.create({
    customer: speaker.stripe_customer_id,
    return_url: `${origin}/dashboard/account`,
  })

  return NextResponse.json({ url: portal.url })
}
