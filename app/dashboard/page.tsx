import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { getUserTalks, getSessionsForTalks } from "@/lib/db"
import Link from "next/link"
import { Plus, Radio, Settings, CalendarDays } from "lucide-react"
import { DeleteTalkButton } from "@/components/dashboard/delete-talk-button"

const FREE_TALK_LIMIT = 5

export default async function DashboardPage() {
  await requireAuth()
  const supabase = await createClient()

  // Fetch talks and sessions via shared db helpers.
  // Nested selects on RLS-protected related tables return empty because the
  // embedded relation query doesn't carry auth context through the FK join,
  // so we fetch them separately.
  const talkList = await getUserTalks(supabase)
  const talkIds = talkList.map((t) => t.id)
  const sessions = await getSessionsForTalks(supabase, talkIds)

  const sessionsByTalkId = sessions.reduce<
    Record<string, { id: string; scheduled_at: string }[]>
  >((acc, s) => {
    if (!acc[s.talk_id]) acc[s.talk_id] = []
    acc[s.talk_id].push(s)
    return acc
  }, {})

  const usedCount = talkList.length
  const usagePercent = Math.min(Math.round((usedCount / FREE_TALK_LIMIT) * 100), 100)

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
            Your Talks
          </h1>
          <p className="font-mono text-xs text-jsconf-muted mt-1">
            {usedCount} of {FREE_TALK_LIMIT} talks used on free plan
          </p>
        </div>
        {usedCount < FREE_TALK_LIMIT && (
          <Link
            href="/dashboard/talks/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-jsconf-yellow/90 transition-all duration-150"
          >
            <Plus className="h-4 w-4" />
            New Talk
          </Link>
        )}
      </div>

      {/* Free plan usage bar */}
      <div className="mb-8 p-4 bg-jsconf-surface border border-jsconf-border">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-jsconf-muted uppercase tracking-wider">Free plan</span>
          <span className="font-mono text-xs text-white">
            {usedCount} / {FREE_TALK_LIMIT} talks
          </span>
        </div>
        <div className="h-1.5 bg-jsconf-surface-2 w-full">
          <div
            className="h-full bg-jsconf-yellow transition-all duration-500"
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        {usedCount >= FREE_TALK_LIMIT && (
          <p className="font-mono text-xs text-jsconf-yellow mt-2">
            Limit reached.{" "}
            <Link href="/dashboard/upgrade" className="underline hover:text-white">
              Upgrade to add more talks.
            </Link>
          </p>
        )}
      </div>

      {/* Talks list */}
      {talkList.length === 0 ? (
        <div className="border border-dashed border-jsconf-border bg-jsconf-surface p-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-jsconf-yellow-dim flex items-center justify-center mb-4">
            <Radio className="h-5 w-5 text-jsconf-yellow" />
          </div>
          <h2 className="font-display font-bold text-lg text-white mb-2 uppercase tracking-wide">
            No talks yet
          </h2>
          <p className="font-mono text-sm text-jsconf-muted mb-6 max-w-sm">
            Create your first talk to start collecting live reactions and questions from your audience.
          </p>
          <Link
            href="/dashboard/talks/new"
            className="inline-flex items-center gap-2 px-5 py-3 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-jsconf-yellow/90 transition-all duration-150"
          >
            <Plus className="h-4 w-4" />
            Create your first talk
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {talkList.map((talk) => {
            const talkSessions = sessionsByTalkId[talk.id] ?? []
            const sessionCount = talkSessions.length
            const lastSession = talkSessions[0] // already sorted desc
            const lastSessionDate = lastSession
              ? new Date(lastSession.scheduled_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : null

            return (
              <div
                key={talk.id}
                className="bg-jsconf-surface border border-jsconf-border p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-white text-base truncate">
                    {talk.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="font-mono text-xs text-jsconf-muted flex items-center gap-1.5">
                      <Radio className="h-3 w-3" />
                      {sessionCount} {sessionCount === 1 ? "session" : "sessions"}
                    </span>
                    {lastSessionDate && (
                      <span className="font-mono text-xs text-jsconf-muted flex items-center gap-1.5">
                        <CalendarDays className="h-3 w-3" />
                        Last: {lastSessionDate}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <DeleteTalkButton talkId={talk.id} talkTitle={talk.title} variant="icon" />
                  <Link
                    href={`/dashboard/talks/${talk.slug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-jsconf-border font-mono text-xs uppercase tracking-wider text-jsconf-muted hover:text-white hover:border-white transition-all duration-150"
                  >
                    <Settings className="h-3 w-3" />
                    Manage
                  </Link>
                  <Link
                    href={`/dashboard/talks/${talk.slug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-jsconf-yellow/90 transition-all duration-150"
                  >
                    <Radio className="h-3 w-3" />
                    Go Live
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
