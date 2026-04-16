"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ClientMessage, Question } from "@/lib/types"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { AttendeeQuestionCard } from "@/components/shared/question-card"

interface AskTabProps {
  send: (message: ClientMessage) => void
  questions: Question[]
}

export function AskTab({ send, questions }: AskTabProps) {
  const [name, setName] = useState("")
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [votedQuestions, setVotedQuestions] = useState<Set<string>>(new Set())

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.votedQuestions)
    if (stored) {
      try {
        setVotedQuestions(new Set(JSON.parse(stored)))
      } catch (e) {
        console.error("Failed to parse voted questions:", e)
      }
    }
  }, [])

  const handleSubmit = () => {
    if (!text.trim()) return

    setIsSubmitting(true)

    send({
      type: "question",
      id: crypto.randomUUID(),
      name: name.trim() || "Anonymous",
      text: text.trim(),
      votes: 0,
      answered: false,
      ts: Date.now(),
    })

    setText("")
    setIsSubmitting(false)
  }

  const handleVote = (questionId: string) => {
    if (votedQuestions.has(questionId)) return

    send({ type: "vote", questionId })

    const newVoted = new Set(votedQuestions)
    newVoted.add(questionId)
    setVotedQuestions(newVoted)
    localStorage.setItem(STORAGE_KEYS.votedQuestions, JSON.stringify([...newVoted]))
  }

  const sortedQuestions = [...questions].sort((a, b) => b.votes - a.votes)

  return (
    <div className="flex flex-col gap-6">
      {/* Ask a Question Form */}
      <div className="flex flex-col gap-4 p-4 bg-jsconf-surface border border-jsconf-border">
        <h3 className="font-mono text-xs text-jsconf-muted uppercase tracking-wide flex items-center gap-2">
          <span className="w-1 h-4 bg-jsconf-yellow"></span>
          Ask a Question
        </h3>
        
        <Input
          placeholder="Anonymous"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-jsconf-bg border-jsconf-border rounded-none h-10 font-sans text-white placeholder:text-jsconf-muted focus:border-jsconf-yellow focus:ring-jsconf-yellow/20"
        />

        <div className="flex flex-col gap-1">
          <Textarea
            placeholder="What would you like to ask?"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 200))}
            maxLength={200}
            className="bg-jsconf-bg border-jsconf-border rounded-none font-sans text-white placeholder:text-jsconf-muted resize-none focus:border-jsconf-yellow focus:ring-jsconf-yellow/20"
            rows={3}
          />
          <span className="font-mono text-xs text-jsconf-muted text-right">
            {text.length}/200
          </span>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || isSubmitting}
          className="w-full h-11 rounded-none bg-jsconf-yellow text-black font-display font-bold uppercase tracking-wide hover:bg-jsconf-yellow/90 disabled:opacity-40"
        >
          Submit Question
        </Button>
      </div>

      {/* Questions List */}
      <div className="flex flex-col gap-3">
        <h3 className="font-mono text-xs text-jsconf-muted uppercase tracking-wide flex items-center gap-2">
          <span className="w-1 h-4 bg-jsconf-yellow"></span>
          Questions ({questions.length})
        </h3>

        {sortedQuestions.length === 0 ? (
          <p className="text-sm text-jsconf-muted text-center py-8 font-sans">
            No questions yet. Be the first to ask!
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedQuestions.map((question) => (
              <AttendeeQuestionCard
                key={question.id}
                question={question}
                voted={votedQuestions.has(question.id)}
                onVote={handleVote}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
