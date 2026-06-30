import type { Metadata } from "next"
import { DemoTour } from "@/components/demo-tour/demo-tour"

export const metadata: Metadata = {
  title: "Evoca — Interactive Tour",
  description:
    "See Evoca in action: real-time reactions and live Q&A for any talk or conference. This 2-minute interactive tour walks you through the full attendee experience.",
}

export default function TourPage() {
  return <DemoTour />
}
