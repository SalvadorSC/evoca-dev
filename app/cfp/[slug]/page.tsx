import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getCfpBySlug } from "@/lib/cfp"
import { CfpSubmissionForm } from "@/components/cfp/cfp-submission-form"
import { CalendarClock, Lock } from "lucide-react"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const cfp = await getCfpBySlug(slug)
  if (!cfp) return { title: "Call for Papers" }
  return {
    title: `${cfp.title} · ${cfp.conferenceName}`,
    description: cfp.description ?? `Submit a talk proposal for ${cfp.conferenceName}.`,
  }
}

const CLOSED_COPY: Record<string, { heading: string; body: string }> = {
  disabled: {
    heading: "Submissions aren't open",
    body: "The organizers haven't opened this call for papers yet. Check back soon.",
  },
  not_open_yet: {
    heading: "Submissions open soon",
    body: "This call for papers hasn't opened yet. Please come back once it's live.",
  },
  closed: {
    heading: "Submissions are closed",
    body: "The deadline for this call for papers has passed. Thanks for your interest!",
  },
}

export default async function CfpPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const cfp = await getCfpBySlug(slug)
  if (!cfp) notFound()

  return (
    <main className="min-h-screen bg-jsconf-bg">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <header className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-jsconf-yellow mb-3">
            {cfp.conferenceName}
          </p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-white text-balance">
            {cfp.title}
          </h1>
          {cfp.description && (
            <p className="mt-4 font-mono text-sm leading-relaxed text-jsconf-muted text-pretty">
              {cfp.description}
            </p>
          )}
        </header>

        {cfp.isAcceptingSubmissions ? (
          <section className="border border-jsconf-border bg-jsconf-surface p-5 sm:p-7">
            <CfpSubmissionForm slug={cfp.slug} questions={cfp.questions} />
          </section>
        ) : (
          <ClosedState reason={cfp.closedReason} />
        )}

        <footer className="mt-10 flex items-center gap-2 text-jsconf-muted">
          <span className="font-mono text-xs">Powered by</span>
          <span className="font-display font-bold text-sm text-white uppercase tracking-wide">Evoca</span>
        </footer>
      </div>
    </main>
  )
}

function ClosedState({ reason }: { reason: string | null }) {
  const copy = CLOSED_COPY[reason ?? "disabled"] ?? CLOSED_COPY.disabled
  const Icon = reason === "not_open_yet" ? CalendarClock : Lock
  return (
    <section className="border border-jsconf-border bg-jsconf-surface p-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-jsconf-bg border border-jsconf-border mb-4">
        <Icon className="h-5 w-5 text-jsconf-muted" />
      </div>
      <h2 className="font-display font-bold text-xl text-white mb-2">{copy.heading}</h2>
      <p className="font-mono text-sm text-jsconf-muted text-balance">{copy.body}</p>
    </section>
  )
}
