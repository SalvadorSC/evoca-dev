"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Star, MessageSquare } from "lucide-react"

interface FeedbackRow {
  id: string
  rating: number
  comment: string | null
  created_at: string
}

interface Props {
  sessionId: string
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className="w-3.5 h-3.5"
          fill={rating >= s ? "#F7E018" : rating >= s - 0.5 ? "#F7E018" : "none"}
          stroke={rating >= s - 0.5 ? "#F7E018" : "#444"}
          style={rating >= s - 0.5 && rating < s ? { clipPath: "inset(0 50% 0 0)" } : undefined}
        />
      ))}
    </div>
  )
}

export function SessionFeedbackResults({ sessionId }: Props) {
  const [feedback, setFeedback] = useState<FeedbackRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from("session_feedback")
        .select("id, rating, comment, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })

      setFeedback((data as FeedbackRow[]) ?? [])
      setLoading(false)
    }
    load()
  }, [sessionId])

  if (loading) return (
    <p className="font-mono text-xs text-jsconf-muted animate-pulse">Loading feedback...</p>
  )

  if (feedback.length === 0) return (
    <p className="font-mono text-xs text-jsconf-muted">No feedback yet for this session.</p>
  )

  const avg = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
  const comments = feedback.filter((f) => f.comment)

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-display font-bold text-3xl text-white">{avg.toFixed(1)}</span>
          <StarDisplay rating={avg} />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs text-jsconf-muted">{feedback.length} {feedback.length === 1 ? "response" : "responses"}</span>
          <span className="font-mono text-xs text-jsconf-muted">{comments.length} {comments.length === 1 ? "comment" : "comments"}</span>
        </div>
      </div>

      {/* Rating distribution */}
      <div className="flex flex-col gap-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = feedback.filter((f) => Math.round(f.rating) === star).length
          const pct = feedback.length > 0 ? (count / feedback.length) * 100 : 0
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-jsconf-muted w-3 shrink-0">{star}</span>
              <div className="flex-1 h-1.5 bg-jsconf-border">
                <div
                  className="h-full bg-jsconf-yellow transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-jsconf-muted w-4 text-right shrink-0">{count}</span>
            </div>
          )
        })}
      </div>

      {/* Comments */}
      {comments.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-jsconf-border pt-4">
          <p className="font-mono text-[10px] text-jsconf-muted uppercase tracking-widest flex items-center gap-1.5">
            <MessageSquare className="h-3 w-3" />
            Comments
          </p>
          {comments.map((f) => (
            <div key={f.id} className="flex flex-col gap-1 p-3 border border-jsconf-border">
              <div className="flex items-center gap-2">
                <StarDisplay rating={f.rating} />
                <span className="font-mono text-[10px] text-jsconf-muted">
                  {new Date(f.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>
              <p className="font-sans text-xs text-white leading-relaxed">{f.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
