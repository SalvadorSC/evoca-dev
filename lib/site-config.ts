// Central place for brand + SEO constants used across metadata, sitemap,
// robots, manifest, structured data, and the OG image.
export const siteConfig = {
  name: "EVOCA",
  // Canonical production origin Google should index. Override in env if needed.
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://evoca.dev").replace(/\/$/, ""),
  title: "EVOCA — Turn any talk into a live experience",
  shortDescription:
    "Real-time conference engagement for speakers and organizers — live reactions, Q&A, and audience participation.",
  description:
    "EVOCA turns any talk into a live experience. Speakers and conference organizers get real-time audience reactions, live Q&A, polls, and engagement analytics — an affordable alternative to Slido and Mentimeter.",
  // Keywords double as brand + competitor-adjacent intent terms.
  keywords: [
    "EVOCA",
    "evoca.dev",
    "live audience engagement",
    "conference engagement platform",
    "live Q&A",
    "live reactions",
    "audience participation",
    "event interaction software",
    "Slido alternative",
    "Mentimeter alternative",
    "speaker engagement tool",
    "conference organizer software",
  ],
  twitter: "@evoca", // update if/when a handle exists
  locale: "en_US",
} as const

// Marketing pages that should be crawled and ranked.
export const publicRoutes = ["/", "/pricing", "/demo"] as const
