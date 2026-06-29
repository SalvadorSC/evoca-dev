import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { CfpReviewBoard, type ReviewSubmission } from "@/components/conference/cfp-review-board"

export const dynamic = "force-dynamic"

export default async function CfpReviewPage({
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

  const [{ data: submissions }, { data: questions }] = await Promise.all([
    supabase
      .from("cfp_submissions")
      .select("id, name, email, title, abstract, talk_format, bio, status, rating, reviewer_notes, created_at")
      .eq("conference_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("cfp_custom_questions")
      .select("id, label, type")
      .eq("conference_id", id)
      .order("sort_order", { ascending: true }),
  ])

  const subIds = (submissions ?? []).map((s) => s.id as string)
  const answersBySubmission: Record<string, { questionId: string; answer: unknown }[]> = {}
  if (subIds.length > 0) {
    const { data: answers } = await supabase
      .from("cfp_submission_answers")
      .select("submission_id, question_id, answer")
      .in("submission_id", subIds)
    for (const a of answers ?? []) {
      const sid = a.submission_id as string
      ;(answersBySubmission[sid] ||= []).push({
        questionId: a.question_id as string,
        answer: a.answer,
      })
    }
  }

  const rows: ReviewSubmission[] = (submissions ?? []).map((s) => ({
    id: s.id as string,
    name: s.name as string,
    email: s.email as string,
    title: s.title as string,
    abstract: s.abstract as string,
    talkFormat: s.talk_format as string,
    bio: (s.bio as string | null) ?? null,
    status: s.status as ReviewSubmission["status"],
    rating: (s.rating as number | null) ?? null,
    reviewerNotes: (s.reviewer_notes as string | null) ?? null,
    answers: answersBySubmission[s.id as string] ?? [],
  }))

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <Link
        href={`/dashboard/conference/${id}/cfp`}
        className="inline-flex items-center gap-1.5 font-mono text-xs text-jsconf-muted hover:text-white uppercase tracking-wider mb-5"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to CFP settings
      </Link>

      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
          Review submissions
        </h1>
        <p className="font-mono text-xs text-jsconf-muted mt-1">{conference.name}</p>
      </div>

      <CfpReviewBoard
        conferenceId={id}
        submissions={rows}
        questionLabels={Object.fromEntries((questions ?? []).map((q) => [q.id as string, q.label as string]))}
      />
    </div>
  )
}
