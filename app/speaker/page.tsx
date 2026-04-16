"use client"

import { useState, useEffect } from "react"
import { useParty } from "@/hooks/use-party"
import { Header } from "@/components/shared/header"
import { Button } from "@/components/ui/button"
import { ChevronUp, Check, Play, Pause, RotateCcw, ChevronDown } from "lucide-react"

const TIMER_OPTIONS = [5, 10, 15] as const
const DEFAULT_TIMER_MINUTES = 10

export default function SpeakerPage() {
  const { state, send, connectionCount, isConnected } = useParty()

  // Timer state
  const [selectedMinutes, setSelectedMinutes] = useState(DEFAULT_TIMER_MINUTES)
  const [timerSeconds, setTimerSeconds] = useState(DEFAULT_TIMER_MINUTES * 60)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showAnswered, setShowAnswered] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1)
      }, 1000)
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning, timerSeconds])

  const handleStartPause = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  const handleReset = () => {
    setTimerSeconds(selectedMinutes * 60)
    setIsTimerRunning(false)
  }

  const handleSelectDuration = (minutes: number) => {
    setSelectedMinutes(minutes)
    setTimerSeconds(minutes * 60)
    setIsTimerRunning(false)
  }

  const handleMarkAnswered = (questionId: string) => {
    send({ type: "answer", questionId })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const unansweredQuestions = state.questions
    .filter((q) => !q.answered)
    .sort((a, b) => b.votes - a.votes)

  const answeredQuestions = state.questions
    .filter((q) => q.answered)
    .sort((a, b) => b.ts - a.ts)

  const isTimerLow = timerSeconds < 60
  const isTimerCritical = timerSeconds < 30

  return (
    <div className="min-h-screen bg-jsconf-bg">
      <Header 
        pageName="Speaker" 
        connectionCount={connectionCount} 
        isConnected={isConnected}
        currentTalk={state.currentTalk}
      />

      <main className="p-4 space-y-6 max-w-3xl mx-auto">
        {/* Countdown Timer */}
        <section
          className={`bg-jsconf-surface border p-6 ${
            isTimerCritical
              ? "border-jsconf-red bg-jsconf-red/10"
              : isTimerLow
              ? "border-jsconf-orange bg-jsconf-orange/10"
              : "border-jsconf-border"
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            {/* Duration Selector */}
            <div className="flex items-center gap-2 mb-4">
              {TIMER_OPTIONS.map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => handleSelectDuration(minutes)}
                  disabled={isTimerRunning}
                  className={`px-4 py-2 font-mono text-sm font-bold border transition-all ${
                    selectedMinutes === minutes
                      ? "bg-jsconf-yellow text-black border-jsconf-yellow"
                      : "bg-transparent text-jsconf-muted border-jsconf-border hover:border-jsconf-yellow hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  {minutes}m
                </button>
              ))}
            </div>
            <div
              className={`font-mono text-6xl font-bold tabular-nums ${
                isTimerCritical
                  ? "text-jsconf-red"
                  : isTimerLow
                  ? "text-jsconf-orange"
                  : "text-jsconf-yellow"
              }`}
            >
              {formatTime(timerSeconds)}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Button
                size="lg"
                onClick={handleStartPause}
                className={`h-12 px-6 rounded-none font-display font-bold uppercase tracking-wide ${
                  isTimerRunning
                    ? "bg-jsconf-surface-2 border border-jsconf-border text-white hover:bg-jsconf-surface"
                    : "bg-jsconf-yellow text-black hover:bg-jsconf-yellow/90"
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Start
                  </>
                )}
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={handleReset}
                className="h-12 px-6 rounded-none border-jsconf-border text-jsconf-muted hover:text-white hover:border-jsconf-yellow"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </section>

        {/* Unanswered Questions */}
        <section className="bg-jsconf-surface border border-jsconf-border p-4">
          <h2 className="font-mono text-xs text-jsconf-muted uppercase tracking-wide flex items-center gap-2 mb-4">
            <span className="w-1 h-4 bg-jsconf-yellow"></span>
            Questions ({unansweredQuestions.length})
          </h2>
          {unansweredQuestions.length === 0 ? (
            <p className="font-sans text-sm text-jsconf-muted text-center py-8">
              No questions yet. Attendees can ask questions from the app.
            </p>
          ) : (
            <div className="space-y-4">
              {unansweredQuestions.map((question, index) => (
                <div
                  key={question.id}
                  className={`flex items-start gap-4 p-4 border ${
                    index === 0 
                      ? "border-jsconf-yellow shadow-[0_0_0_1px_var(--jsconf-yellow)] bg-jsconf-surface-2" 
                      : "border-jsconf-border bg-jsconf-surface-2"
                  }`}
                >
                  {/* Vote count */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <ChevronUp className="h-6 w-6 text-jsconf-yellow" />
                    <span className="font-mono text-2xl font-bold text-jsconf-yellow">{question.votes}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-lg text-white">{question.text}</p>
                    <p className="font-mono text-sm text-jsconf-muted mt-1">
                      {question.name}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleMarkAnswered(question.id)}
                    className="shrink-0 rounded-none border-jsconf-border text-jsconf-muted hover:text-white hover:border-green-500 hover:bg-green-500/10"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Answered
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Answered Questions (Collapsed) */}
        {answeredQuestions.length > 0 && (
          <section className="bg-jsconf-surface border border-jsconf-border p-4 opacity-60">
            <button
              onClick={() => setShowAnswered(!showAnswered)}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="font-mono text-xs text-jsconf-muted uppercase tracking-wide flex items-center gap-2">
                <span className="w-1 h-4 bg-green-500"></span>
                Answered ({answeredQuestions.length})
              </h2>
              {showAnswered ? (
                <ChevronUp className="h-5 w-5 text-jsconf-muted" />
              ) : (
                <ChevronDown className="h-5 w-5 text-jsconf-muted" />
              )}
            </button>
            {showAnswered && (
              <div className="space-y-3 mt-4">
                {answeredQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-start gap-3 p-3 border border-jsconf-border bg-jsconf-surface-2"
                  >
                    <div className="flex items-center gap-1 text-green-500">
                      <Check className="h-4 w-4" />
                      <span className="font-mono text-sm font-medium">{question.votes}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm text-white">{question.text}</p>
                      <p className="font-mono text-xs text-jsconf-muted mt-1">
                        {question.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
