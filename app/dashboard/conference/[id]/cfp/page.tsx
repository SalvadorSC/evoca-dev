import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Inbox } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { ensureCfpSettings } from "@/app/dashboard/conference/cfp-actions"
import { CfpSettingsManager } from "@/components/conference/cfp-settings-manager"

export const dynamic = "force-dynamic"

export default async function CfpSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth()
  const { id } = await params
  const supabase = await createClient()

  const { data: conference } = await supabase
    .from("conferences")
    .select("id, name")
    .eq("id", id)
    .maybeSingle()
  if (!conference) notFound()

  // Create the CFP row on first visit so the page always has settings to edit.
  await ensureCfpSettings(id)

  const [{ data: settings }, { data: questions }, { count: submissionCount }] =
    await Promise.all([
      supabase
        .from("cfp_settings")
        .select("slug, is_open, opens_at, closes_at, title, description, max_submissions_per_email")
        .eq("conference_id", id)
        .maybeSingle(),
      supabase
        .from("cfp_custom_questions")
        .select("id, label, type, options, required, sort_order")
        .eq("conference_id", id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("cfp_submissions")
        .select("id", { count: "exact", head: true })
        .eq("conference_id", id),
    ])

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <Link
        href={`/dashboard/conference/${id}`}
        className="inline-flex items-center gap-1.5 font-mono text-xs text-jsconf-muted hover:text-white uppercase tracking-wider mb-5"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to schedule
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
            Call for Papers
          </h1>
          <p className="font-mono text-xs text-jsconf-muted mt-1">{conference.name}</p>
        </div>
        <Link
          href={`/dashboard/conference/${id}/cfp/review`}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-jsconf-border font-mono text-xs uppercase tracking-wider text-white hover:border-jsconf-yellow transition-colors shrink-0"
        >
          <Inbox className="h-3 w-3" />
          Review ({submissionCount ?? 0})
        </Link>
      </div>

      <CfpSettingsManager
        conferenceId={id}
        slug={(settings?.slug as string) ?? ""}
        initialSettings={{
          isOpen: Boolean(settings?.is_open),
          opensAt: (settings?.opens_at as string | null) ?? null,
          closesAt: (settings?.closes_at as string | null) ?? null,
          title: (settings?.title as string) ?? "Call for Papers",
          description: (settings?.description as string | null) ?? null,
          maxSubmissionsPerEmail: (settings?.max_submissions_per_email as number) ?? 3,
        }}
        initialQuestions={(questions ?? []).map((q) => ({
          id: q.id as string,
          label: q.label as string,
          type: q.type as never,
          options: (q.options as string[] | null) ?? null,
          required: Boolean(q.required),
        }))}
      />
    </div>
  )
}
