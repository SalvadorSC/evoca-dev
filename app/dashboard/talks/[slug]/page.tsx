import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { getTalkBySlug } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import React from "react"
import { ArrowLeft, Radio, Clock, MessageSquare, Zap, ExternalLink, Star, MessageCircleQuestion } from "lucide-react"
import { StartSessionButton } from "./start-session-button"
import { DeleteTalkButton } from "@/components/dashboard/delete-talk-button"
import { SessionFeedbackResults } from "@/components/dashboard/session-feedback-results"

type SessionRow = {
  id: string
  partykit_room: string
  scheduled_at: string
  ended_at: string | null
  status: string
  question_count: number | null  // fix: nullable
  reaction_count: number | null  // fix: nullable
}

type TalkRow = {
  id: string
  title: string
  description: string | null
  slug: string
  slide_url: string | null
  slide_type: string | null
  created_at: string
}

function formatDuration(start: string, end: string | null): string {
  if (!end) return "Ongoing"
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default async function TalkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  await requireAuth()
  const supabase = await createClient()

  const talk = await getTalkBySlug(supabase, slug)
  if (!talk) notFound()

  const talkData = talk as TalkRow

  const { data: sessionsData } = await supabase
    .from("sessions")
    .select("id, partykit_room, scheduled_at, ended_at, status, question_count, reaction_count")
    .eq("talk_id", talkData.id)
    .order("scheduled_at", { ascending: false })

  const sessions = (sessionsData ?? []) as SessionRow[]

  const { data: speakerProfile } = await supabase
    .from("speakers")
    .select("is_pro")
    .eq("user_id", user.id)
    .maybeSingle()

  const speakerIsPro = speakerProfile?.is_pro ?? false

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 font-mono text-xs text-jsconf-muted hover:text-white uppercase tracking-wider mb-8 transition-all duration-150"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Talks
      </Link>

      {/* Talk header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-2xl text-white uppercase tracking-wide leading-tight">
              {talkData.title}
            </h1>
            {talkData.description && (
              <p className="font-sans text-sm text-jsconf-muted mt-2 leading-relaxed max-w-lg">
                {talkData.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DeleteTalkButton
              talkId={talkData.id}
              talkTitle={talkData.title}
              variant="full"
            />
            <StartSessionButton talkId={talkData.id} speakerIsPro={speakerIsPro} />
          </div>
        </div>

        {/* Slide preview */}
        {talkData.slide_url && (
          <div className="mt-5 p-4 bg-jsconf-surface border border-jsconf-border flex items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="font-mono text-[10px] text-jsconf-muted uppercase tracking-wider block mb-0.5">
                Slides
              </span>
              <span className="font-mono text-xs text-white truncate max-w-xs block">
                {talkData.slide_url}
              </span>
            </div>
            <a
              href={talkData.slide_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-jsconf-border font-mono text-xs uppercase tracking-wider text-jsconf-muted hover:text-white hover:border-white transition-all duration-150 shrink-0"
            >
              <ExternalLink className="h-3 w-3" />
              Preview
            </a>
          </div>
        )}
      </div>

      {/* Sessions */}
      <div>
        <h2 className="font-mono text-xs text-jsconf-muted uppercase tracking-wider mb-4">
          Sessions ({sessions.length})
        </h2>

        {sessions.length === 0 ? (
          <div className="border border-dashed border-jsconf-border bg-jsconf-surface p-10 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 bg-jsconf-yellow-dim flex items-center justify-center mb-3">
              <Radio className="h-4 w-4 text-jsconf-yellow" />
            </div>
            <p className="font-mono text-sm text-white mb-1">No sessions yet</p>
            <p className="font-mono text-xs text-jsconf-muted">
              Start a session to go live with your audience.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((session, index) => {
              const date = new Date(session.scheduled_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
              const time = new Date(session.scheduled_at).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })

              // fix: only sessions explicitly marked "live" are live
              const isLive = session.status === "live"
              const duration = formatDuration(session.scheduled_at, session.ended_at)

              return (
                // fix: Fragment with key wraps both nodes; feedback moved inside card
                <React.Fragment key={session.id}>
                  <div className="bg-jsconf-surface border border-jsconf-border p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs text-jsconf-muted w-6 text-right">
                        #{sessions.length - index}
                      </span>
                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-jsconf-yellow-dim border border-jsconf-yellow/30 font-mono text-[10px] text-jsconf-yellow uppercase tracking-wider">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-jsconf-yellow opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-jsconf-yellow" />
                          </span>
                          Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 border border-jsconf-border font-mono text-[10px] text-jsconf-muted uppercase tracking-wider">
                          Ended
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-wrap gap-4">
                      <span className="font-mono text-xs text-white">
                        {date} · {time}
                      </span>
                      <span className="font-mono text-xs text-jsconf-muted flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {duration}
                      </span>
                      <span className="font-mono text-xs text-jsconf-muted flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {/* fix: null-coalesce counts */}
                        {session.question_count ?? 0} Q&A
                      </span>
                      <span className="font-mono text-xs text-jsconf-muted flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {session.reaction_count ?? 0} reactions
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/qna/${session.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-jsconf-border font-mono text-xs uppercase tracking-wider text-jsconf-muted hover:text-white hover:border-white transition-all duration-150"
                      >
                        <MessageCircleQuestion className="h-3 w-3" />
                        Q&A
                      </Link>
                      {isLive ? (
                        <Link
                          href={`/present/${session.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-jsconf-yellow/90 transition-all duration-150"
                        >
                          <Radio className="h-3 w-3" />
                          Rejoin
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-2 border border-jsconf-border font-mono text-xs uppercase tracking-wider text-jsconf-muted">
                          <Star className="h-3 w-3" />
                          Finished
                        </span>
                      )}
                    </div>

                    {/* fix: feedback section is now INSIDE the card div */}
                    {!isLive && (
                      <div className="mt-4 pt-4 border-t border-jsconf-border w-full">
                        <p className="font-mono text-[10px] text-jsconf-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <Star className="h-3 w-3" />
                          Feedback
                        </p>
                        <SessionFeedbackResults sessionId={session.id} />
                      </div>
                    )}
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
