import "server-only"
import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // Pin to the SDK's bundled API version for stable typing.
  apiVersion: "2026-06-24.dahlia",
  appInfo: { name: "Evoca" },
})
