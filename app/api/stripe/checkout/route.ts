import { NextResponse, type NextRequest } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { currencyForCountry } from "@/lib/locale"
import { getPlan } from "@/lib/plans"
import { validateEventWindow } from "@/lib/billing"

export const dynamic = "force-dynamic"

interface CheckoutBody {
  planId?: string
  // Optional one-time event window. If activateNow is true we ignore these and
  // start a 7-day window immediately.
  eventStart?: string
  eventEnd?: string
  activateNow?: boolean
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  let body: CheckoutBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const plan = body.planId ? getPlan(body.planId) : undefined
  if (!plan || !plan.live) {
    return NextResponse.json({ error: "Unknown or unavailable plan." }, { status: 400 })
  }
  // Phase 1: only organizer plans are purchasable.
  if (plan.audience !== "organizer") {
    return NextResponse.json({ error: "This plan is not available yet." }, { status: 400 })
  }

  // ── Resolve currency from visitor country ──
  const h = await headers()
  const country = h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? null
  const currency = currencyForCountry(country)
  const unitAmount = plan.amount[currency]

  // ── Determine event window for one-time plans ──
  let eventStart: string | null = null
  let eventEnd: string | null = null
  if (plan.id === "organizer_onetime") {
    if (body.activateNow) {
      const start = new Date()
      const end = new Date(start.getTime() + (plan.accessDays ?? 7) * 24 * 60 * 60 * 1000)
      eventStart = start.toISOString()
      eventEnd = end.toISOString()
    } else if (body.eventStart && body.eventEnd) {
      const check = validateEventWindow(body.eventStart, body.eventEnd)
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 })
      }
      eventStart = new Date(body.eventStart).toISOString()
      eventEnd = new Date(body.eventEnd).toISOString()
    }
    // If neither provided, window stays null => webhook creates a
    // pending_activation row the user sets up later on the account page.
  }

  // ── Get or create the Stripe customer ──
  const { data: speaker } = await supabase
    .from("speakers")
    .select("stripe_customer_id, display_name")
    .eq("user_id", user.id)
    .maybeSingle()

  let customerId = speaker?.stripe_customer_id ?? null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: speaker?.display_name ?? undefined,
      metadata: { user_id: user.id },
    })
    customerId = customer.id
    await supabase
      .from("speakers")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", user.id)
  }

  // ── Build the checkout session ──
  const origin = h.get("origin") ?? new URL(req.url).origin

  const metadata: Record<string, string> = {
    user_id: user.id,
    plan_id: plan.id,
    currency,
  }
  if (eventStart) metadata.event_start = eventStart
  if (eventEnd) metadata.event_end = eventEnd

  const session = await stripe.checkout.sessions.create({
    mode: plan.mode,
    customer: customerId,
    client_reference_id: user.id,
    metadata,
    // Mirror metadata onto the subscription so subscription.* events keep it.
    ...(plan.mode === "subscription"
      ? { subscription_data: { metadata } }
      : { payment_intent_data: { metadata } }),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: unitAmount,
          product_data: { name: `Evoca: ${plan.name}` },
          ...(plan.mode === "subscription"
            ? { recurring: { interval: plan.recurringInterval! } }
            : {}),
        },
      },
    ],
    success_url: `${origin}/dashboard/account?checkout=success`,
    cancel_url: `${origin}/dashboard/account?checkout=cancelled`,
  })

  return NextResponse.json({ url: session.url })
}
