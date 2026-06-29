import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { currencyForCountry } from "@/lib/locale"
import { PLANS, type PlanId } from "@/lib/plans"

export const dynamic = "force-dynamic"

export async function GET() {
  const h = await headers()
  // Vercel injects the visitor's country here in production.
  const country =
    h.get("x-vercel-ip-country") ??
    h.get("cf-ipcountry") ??
    null

  const currency = currencyForCountry(country)

  // Return the currency-resolved amount for each plan so the client never
  // has to know both price sets.
  const prices: Record<string, { amount: number; displayMonthly: number | null }> = {}
  for (const id of Object.keys(PLANS) as PlanId[]) {
    const plan = PLANS[id]
    prices[id] = {
      amount: plan.amount[currency],
      displayMonthly: plan.displayMonthly ? plan.displayMonthly[currency] : null,
    }
  }

  return NextResponse.json({ currency, country, prices })
}
