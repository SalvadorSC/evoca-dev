import type { Metadata } from "next"
import { PricingContent } from "@/components/pricing/pricing-content"

export const metadata: Metadata = {
  title: "Pricing — EVOCA",
  description:
    "Simple, transparent pricing for speakers and organizers. Start free with 5 talks, no credit card. Upgrade when you need unlimited talks, analytics and more.",
}

export default function PricingPage() {
  return <PricingContent />
}
