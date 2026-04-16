"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Star, Twitter, Linkedin, Github, Globe, CheckCircle2 } from "lucide-react"

interface SpeakerProfile {
  display_name: string | null
  bio: string | null
  twitter: string | null
  linkedin: string | null
  github: string | null
  website: string | null
  is_pro: boolean
}

interface Props {
  sessionId: string
  talkTitle: string
  attendeeToken: string
}

function StarRating({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const display = hovered ?? value

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const full = display >= star
        const half = !full && display >= star - 0.5

        return (
          <div key={star} className="relative w-9 h-9 cursor-pointer">
            {/* Left half — half star */}
            <div
              className="absolute left-0 top-0 w-1/2 h-full z-10"
              onMouseEnter={() => setHovered(star - 0.5)}
              onClick={() => onChange(star - 0.5)}
            />
            {/* Right half — full star */}
            <div
              className="absolute right-0 top-0 w-1/2 h-full z-10"
              onMouseEnter={() => setHovered(star)}
              onClick={() => onChange(star)}
            />
            <Star
              className="w-9 h-9 transition-colors"
              fill={full || half ? "#F7E018" : "none"}
              stroke={full || half ? "#F7E018" : "#444"}
              style={half ? { clipPath: "inset(0 50% 0 0)" } : undefined}
            />
            {half && (
              <Star
                className="w-9 h-9 absolute inset-0 transition-colors"
                fill="none"
                stroke="#444"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function FeedbackScreen({ sessionId, talkTitle, attendeeToken }: Props) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [speaker, setSpeaker] = useState<SpeakerProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if already submitted (stored in localStorage)
    const key = `evoca-feedback-${sessionId}`
    if (localStorage.getItem(key)) {
      setAlreadySubmitted(true)
      setSubmitted(true)
    }

    // Fetch speaker profile for this session (via talks -> speakers join)
    async function loadSpeaker() {
      const supabase = createClient()
      const { data } = await supabase
        .from("sessions")
        .select("talks(user_id)")
        .eq("id", sessionId)
        .single()

      if (!data?.talks) return
      const userId = (data.talks as any).user_id
      if (!userId) return

      const { data: profile } = await supabase
        .from("speakers")
        .select("display_name, bio, twitter, linkedin, github, website, is_pro")
        .eq("user_id", userId)
        .single()

      if (profile) setSpeaker(profile as SpeakerProfile)
    }
    loadSpeaker()
  }, [sessionId])

  async function handleSubmit() {
    if (rating === 0) return
    setSubmitting(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: insertError } = await supabase
        .from("session_feedback")
        .insert({
          session_id: sessionId,
          attendee_token: attendeeToken,
          rating,
          comment: comment.trim() || null,
        })

      if (insertError) {
        if (insertError.code === "23505") {
          // Unique constraint — already submitted
          setAlreadySubmitted(true)
          setSubmitted(true)
          localStorage.setItem(`evoca-feedback-${sessionId}`, "1")
          return
        }
        setError(insertError.message)
        return
      }

      localStorage.setItem(`evoca-feedback-${sessionId}`, "1")
      setSubmitted(true)
    } catch {
      setError("Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  const hasSocials = speaker?.is_pro && (
    speaker.twitter || speaker.linkedin || speaker.github || speaker.website
  )

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-6">
        <CheckCircle2 className="h-12 w-12 text-jsconf-yellow" strokeWidth={1.5} />
        <div>
          <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide mb-2">
            {alreadySubmitted ? "Already submitted" : "Thank you!"}
          </h2>
          <p className="font-mono text-xs text-jsconf-muted">
            {alreadySubmitted
              ? "You have already left feedback for this session."
              : "Your feedback has been submitted."}
          </p>
        </div>

        {hasSocials && speaker && (
          <div className="border border-jsconf-border bg-jsconf-surface p-5 w-full max-w-sm text-left">
            <p className="font-mono text-[10px] text-jsconf-muted uppercase tracking-widest mb-3">
              Follow the speaker
            </p>
            {speaker.display_name && (
              <p className="font-display font-bold text-white text-lg mb-1">{speaker.display_name}</p>
            )}
            {speaker.bio && (
              <p className="font-sans text-xs text-jsconf-muted mb-4 leading-relaxed">{speaker.bio}</p>
            )}
            <div className="flex flex-col gap-2">
              {speaker.twitter && (
                <a
                  href={`https://x.com/${speaker.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-mono text-xs text-white hover:text-jsconf-yellow transition-colors"
                >
                  <Twitter className="h-4 w-4 shrink-0" />
                  @{speaker.twitter}
                </a>
              )}
              {speaker.linkedin && (
                <a
                  href={`https://linkedin.com/in/${speaker.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-mono text-xs text-white hover:text-jsconf-yellow transition-colors"
                >
                  <Linkedin className="h-4 w-4 shrink-0" />
                  {speaker.linkedin}
                </a>
              )}
              {speaker.github && (
                <a
                  href={`https://github.com/${speaker.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-mono text-xs text-white hover:text-jsconf-yellow transition-colors"
                >
                  <Github className="h-4 w-4 shrink-0" />
                  {speaker.github}
                </a>
              )}
              {speaker.website && (
                <a
                  href={speaker.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-mono text-xs text-white hover:text-jsconf-yellow transition-colors"
                >
                  <Globe className="h-4 w-4 shrink-0" />
                  {speaker.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-8 max-w-sm mx-auto">
      <div>
        <p className="font-mono text-[10px] text-jsconf-muted uppercase tracking-widest mb-1">Session ended</p>
        <h2 className="font-display font-bold text-xl text-white uppercase tracking-wide leading-tight">{talkTitle}</h2>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs text-white uppercase tracking-wide">How was the talk?</p>
        <StarRating value={rating} onChange={setRating} />
        {rating > 0 && (
          <p className="font-mono text-[10px] text-jsconf-muted">
            {rating === 5 ? "Outstanding" : rating >= 4 ? "Great" : rating >= 3 ? "Good" : rating >= 2 ? "Fair" : "Poor"} — {rating} / 5
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-xs text-jsconf-muted uppercase tracking-wide">
          Leave a comment <span className="normal-case font-sans">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 500))}
          placeholder="Anything you'd like the speaker to know..."
          rows={4}
          maxLength={500}
          className="bg-jsconf-surface border border-jsconf-border text-white font-sans text-sm placeholder:text-jsconf-muted p-3 resize-none focus:outline-none focus:border-jsconf-yellow transition-colors"
        />
        <span className="font-mono text-[10px] text-jsconf-muted text-right">{comment.length}/500</span>
      </div>

      {error && <p className="font-mono text-xs text-red-400">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        className="w-full py-3 bg-jsconf-yellow text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-jsconf-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Submitting..." : rating === 0 ? "Select a rating to submit" : "Submit feedback"}
      </button>
    </div>
  )
}
