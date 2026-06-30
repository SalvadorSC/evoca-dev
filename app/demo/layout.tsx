import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Live Demo",
  description:
    "See EVOCA in action — try live reactions, Q&A, and real-time audience engagement in an interactive demo.",
  alternates: {
    canonical: "/demo",
  },
}

// The demo showcases the live event experience and always renders dark,
// regardless of the user's theme.
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <div className="force-dark">{children}</div>
}
