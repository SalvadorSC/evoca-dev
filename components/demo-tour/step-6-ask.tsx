"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronUp } from "lucide-react"
import { StepShell, StepLabel, HighlightRing, YellowButton } from "./primitives"

type SubStep = "post" | "vote" | "done"

interface FakeQuestion {
  id: string
  text: string
  name: string
  votes: number
  voted: boolean
}

const INITIAL_QUESTIONS: FakeQuestion[] = [
  { id: "q1", text: "What's the recommended approach for handling rate limits in production?", name: "Jordan P.", votes: 7, voted: false },
  { id: "q2", text: "Does this work with edge functions?", name: "Lena M.", votes: 3, voted: false },
]

interface Step6AskProps {
  onNext: () => void
}

// The room piles votes onto the user's question up to this count; the user then
// casts the deciding 7th vote, surpassing the top question (6).
const PEER_VOTE_TARGET = 6

export function Step6Ask({ onNext }: Step6AskProps) {
  const [subStep, setSubStep] = useState<SubStep>("post")
  const [questionText, setQuestionText] = useState("")
  const [questions, setQuestions] = useState<FakeQuestion[]>(INITIAL_QUESTIONS)
  const [userQId, setUserQId] = useState<string | null>(null)
  const rampTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  const subStepLabels: Record<SubStep, string> = {
    post: "1 / 2 — Ask a question",
    vote: "2 / 2 — Add your own vote",
    done: "All done!",
  }

  const handleSubmitQuestion = () => {
    if (!questionText.trim()) return
    const id = `q-user-${Date.now()}`
    const newQ: FakeQuestion = {
      id,
      text: questionText.trim(),
      name: "You",
      votes: 0,
      voted: false,
    }
    setQuestions((qs) => [newQ, ...qs])
    setUserQId(id)
    setQuestionText("")
  }

  // Once the user's question is posted, the room quickly piles on votes
  // (animated count up to PEER_VOTE_TARGET), then we invite the user to vote.
  useEffect(() => {
    if (!userQId) return
    rampTimers.current.forEach(clearTimeout)
    rampTimers.current = []

    for (let v = 1; v <= PEER_VOTE_TARGET; v++) {
      const t = setTimeout(() => {
        setQuestions((qs) =>
          qs.map((q) => (q.id === userQId ? { ...q, votes: v } : q)),
        )
        if (v === PEER_VOTE_TARGET) setSubStep("vote")
      }, 350 + v * 120)
      rampTimers.current.push(t)
    }

    return () => {
      rampTimers.current.forEach(clearTimeout)
      rampTimers.current = []
    }
  }, [userQId])

  const handleVote = (id: string) => {
    setQuestions((qs) =>
      qs.map((q) => (q.id === id && !q.voted ? { ...q, votes: q.votes + 1, voted: true } : q)),
    )
    setTimeout(() => setSubStep("done"), 500)
  }

  const sortedQuestions = [...questions].sort((a, b) => b.votes - a.votes)

  return (
    <StepShell label="Step 6: Live Q&A" scrollable>
      <div className="flex flex-col gap-5 p-5 pb-8 min-h-full">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <StepLabel>Attendee view — Q&amp;A</StepLabel>
          <h2 className="font-display font-bold text-xl uppercase tracking-tight">
            Ask &amp; vote
          </h2>
        </div>

        {/* Sub-step badge */}
        <div className="bg-jsconf-yellow-dim border border-jsconf-yellow/30 px-3 py-2">
          <p className="font-mono text-xs text-jsconf-yellow font-bold uppercase tracking-wider">
            {subStepLabels[subStep]}
          </p>
        </div>

        {/* Post question form */}
        <HighlightRing
          active={subStep === "post"}
          label="Ask the speaker anything"
          labelPosition="bottom"
        >
          <div className="bg-jsconf-surface border border-jsconf-border p-4 flex flex-col gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-jsconf-muted flex items-center gap-2">
              <span className="w-1 h-4 bg-jsconf-yellow inline-block" />
              Ask a question
            </span>
            <textarea
              placeholder="What would you like to ask?"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value.slice(0, 200))}
              disabled={subStep !== "post"}
              className="bg-jsconf-bg border border-jsconf-border px-3 py-2 font-sans text-sm text-foreground placeholder:text-jsconf-muted focus:outline-none focus:border-jsconf-yellow resize-none disabled:opacity-50"
              rows={3}
            />
            <button
              onClick={handleSubmitQuestion}
              disabled={!questionText.trim() || subStep !== "post"}
              className="w-full h-11 bg-jsconf-yellow text-black font-display font-bold text-sm uppercase tracking-wider disabled:opacity-40 active:scale-[0.98]"
            >
              Submit Question
            </button>
          </div>
        </HighlightRing>

        {/* Questions list */}
        <div className="flex flex-col gap-2 flex-1">
          <span className="font-mono text-xs uppercase tracking-widest text-jsconf-muted flex items-center gap-2">
            <span className="w-1 h-4 bg-jsconf-yellow inline-block" />
            Questions ({questions.length})
          </span>

          {sortedQuestions.map((q) => {
            const isUserQ = q.id === userQId
            const canVote = subStep === "vote" && isUserQ && !q.voted
            return (
            <HighlightRing
              key={q.id}
              active={canVote}
              label="Add your own vote"
              labelPosition="bottom"
            >
              <div
                className={`bg-jsconf-surface border border-jsconf-border p-3 flex gap-3 items-start animate-in slide-in-from-top-2 duration-300 ${
                  q.id.startsWith("q-user") ? "border-jsconf-yellow/30" : ""
                }`}
              >
                <button
                  onClick={() => canVote && handleVote(q.id)}
                  disabled={!canVote}
                  className={`flex flex-col items-center gap-0.5 p-2 border transition-all duration-150 ${
                    q.voted
                      ? "text-jsconf-yellow bg-jsconf-yellow-dim border-jsconf-yellow"
                      : canVote
                        ? "text-jsconf-muted border-jsconf-border hover:text-jsconf-yellow hover:border-jsconf-yellow"
                        : "text-jsconf-muted border-jsconf-border"
                  } disabled:cursor-not-allowed`}
                >
                  <ChevronUp className="h-4 w-4" />
                  <span
                    key={q.votes}
                    className="font-mono text-sm font-bold inline-block animate-in zoom-in-50 duration-150"
                  >
                    {q.votes}
                  </span>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-sans">{q.text}</p>
                  <p className="font-mono text-xs text-jsconf-muted mt-1">
                    {q.name}
                    {q.id.startsWith("q-user") && (
                      <span className="ml-2 text-jsconf-yellow">← yours</span>
                    )}
                  </p>
                </div>
              </div>
            </HighlightRing>
            )
          })}
        </div>

      </div>

      {/* Floating done CTA — appears ~0.5s after the user votes their question */}
      {subStep === "done" && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-5 bg-gradient-to-t from-jsconf-bg via-jsconf-bg to-transparent animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col gap-3">
            <div className="bg-jsconf-yellow-dim border border-jsconf-yellow/30 px-4 py-3">
              <p className="font-mono text-sm text-jsconf-yellow text-balance">
                You know it&apos;s good, now it&apos;s time for your attendees.
              </p>
            </div>
            <YellowButton onClick={onNext}>Finish →</YellowButton>
          </div>
        </div>
      )}
    </StepShell>
  )
}
