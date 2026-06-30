import type { Metadata } from "next"
import { PricingContent } from "@/components/pricing/pricing-content"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for speakers and organizers. Start free with 5 talks, no credit card. Upgrade when you need unlimited talks, analytics and more.",
  alternates: {
    canonical: "/pricing",
  },
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ for?: string }>
}) {
  const { for: audienceParam } = await searchParams
  const initialAudience = audienceParam === "organizer" ? "organizer" : "speaker"
  return <PricingContent initialAudience={initialAudience} />
}
