import { requireAuth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, MessageSquare, Check, ChevronUp } from "lucide-react"

export const dynamic = "force-dynamic"

interface SavedQuestion {
  id: string
  text: string
  author_name: string | null
  votes: number | null
  answered: boolean | null
  created_at: string | null
}

export default async function SessionQuestionsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const user = await requireAuth()
  const admin = createAdminClient()

  // Verify the caller owns the talk behind this session.
  const { data: session } = await admin
    .from("sessions")
    .select("id, scheduled_at, talks(title, slug, user_id)")
    .eq("id", sessionId)
    .maybeSingle()

  if (!session) notFound()

  const talkRel = (session as { talks?: { title?: string; slug?: string; user_id?: string } | { title?: string; slug?: string; user_id?: string }[] }).talks
  const talk = Array.isArray(talkRel) ? talkRel[0] : talkRel
  if (!talk || talk.user_id !== user.id) notFound()

  const { data: questions } = await admin
    .from("questions")
    .select("id, text, author_name, votes, answered, created_at")
    .eq("session_id", sessionId)
    .order("votes", { ascending: false })
    .order("created_at", { ascending: true })

  const list = (questions ?? []) as SavedQuestion[]
  const date = new Date(session.scheduled_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <Link
        href={talk.slug ? `/dashboard/talks/${talk.slug}` : "/dashboard"}
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-jsconf-muted hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to talk
      </Link>

      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-foreground uppercase tracking-wide text-balance">
          Q&amp;A History
        </h1>
        <p className="font-mono text-xs text-jsconf-muted mt-1">
          {talk.title ?? "Talk"} · {date} · {list.length} question{list.length === 1 ? "" : "s"}
        </p>
      </div>

      {list.length === 0 ? (
        <div className="border border-dashed border-jsconf-border bg-jsconf-surface p-10 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 bg-jsconf-yellow-dim flex items-center justify-center mb-3">
            <MessageSquare className="h-4 w-4 text-jsconf-yellow" />
          </div>
          <p className="font-mono text-sm text-foreground mb-1">No questions saved</p>
          <p className="font-mono text-xs text-jsconf-muted">
            No audience questions were asked during this session.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((q) => (
            <li
              key={q.id}
              className="bg-jsconf-surface border border-jsconf-border p-4 flex items-start gap-4"
            >
              <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                <ChevronUp className="h-4 w-4 text-jsconf-muted" />
                <span className="font-mono text-sm font-bold text-foreground tabular-nums">
                  {q.votes ?? 0}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm text-foreground leading-relaxed text-pretty">
                  {q.text}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="font-mono text-[11px] text-jsconf-muted">
                    {q.author_name?.trim() || "Anonymous"}
                  </span>
                  {q.answered && (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-jsconf-yellow">
                      <Check className="h-3 w-3" />
                      Answered
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
