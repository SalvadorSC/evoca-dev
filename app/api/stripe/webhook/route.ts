import { NextResponse, type NextRequest } from "next/server"
import type Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { getPlan, type PlanId } from "@/lib/plans"
import type { OrganizerSubStatus } from "@/lib/billing"

export const dynamic = "force-dynamic"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

function mapSubStatus(stripeStatus: Stripe.Subscription.Status): OrganizerSubStatus {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active"
    case "past_due":
    case "unpaid":
      return "payment_failed"
    case "canceled":
    case "incomplete_expired":
      return "cancelled"
    default:
      return "pending_activation"
  }
}

function periodEndISO(sub: Stripe.Subscription): string | null {
  // API version dahlia moved current_period_end onto subscription items.
  const item = sub.items?.data?.[0] as { current_period_end?: number } | undefined
  const ts =
    item?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end
  return ts ? new Date(ts * 1000).toISOString() : null
}

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error("[v0] STRIPE_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 })
  }

  const sig = req.headers.get("stripe-signature")
  if (!sig) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error("[v0] Webhook signature verification failed:", (err as Error).message)
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id ?? session.client_reference_id
        const planId = session.metadata?.plan_id as PlanId | undefined
        const plan = planId ? getPlan(planId) : undefined

        if (!userId || !plan || plan.audience !== "organizer") {
          console.error("[v0] checkout.session.completed missing/invalid metadata", {
            userId,
            planId,
          })
          break
        }

        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id ?? null

        // Keep the customer id on the speaker row for future lookups.
        if (customerId) {
          await supabase
            .from("speakers")
            .update({ stripe_customer_id: customerId })
            .eq("user_id", userId)
        }

        if (plan.mode === "subscription") {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id
          let expiresAt: string | null = null
          if (subId) {
            const sub = await stripe.subscriptions.retrieve(subId)
            expiresAt = periodEndISO(sub)
          }
          await supabase.from("organizer_subscriptions").insert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subId ?? null,
            plan: plan.id,
            status: "active",
            expires_at: expiresAt,
          })
        } else {
          // One-time payment.
          const eventStart = session.metadata?.event_start ?? null
          const eventEnd = session.metadata?.event_end ?? null
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null

          await supabase.from("organizer_subscriptions").insert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_payment_intent_id: paymentIntentId,
            plan: plan.id,
            status: eventStart && eventEnd ? "active" : "pending_activation",
            event_start: eventStart,
            event_end: eventEnd,
            expires_at: eventEnd,
          })
        }
        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        await supabase
          .from("organizer_subscriptions")
          .update({
            status: mapSubStatus(sub.status),
            expires_at: periodEndISO(sub),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id)
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        await supabase
          .from("organizer_subscriptions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", sub.id)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subId =
          typeof (invoice as { subscription?: string | Stripe.Subscription }).subscription ===
          "string"
            ? ((invoice as { subscription?: string }).subscription as string)
            : (invoice as { subscription?: Stripe.Subscription }).subscription?.id
        if (subId) {
          await supabase
            .from("organizer_subscriptions")
            .update({ status: "payment_failed", updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", subId)
        }
        break
      }

      default:
        // Ignore unhandled event types.
        break
    }
  } catch (err) {
    console.error("[v0] Webhook handler error:", (err as Error).message)
    return NextResponse.json({ error: "Handler error." }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
