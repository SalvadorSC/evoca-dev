"use client"

import { useState } from "react"
import { TourProgress } from "./primitives"
import type { UserReaction } from "./primitives"
import { Step1Welcome } from "./step-1-welcome"
import { Step2Wall } from "./step-2-wall"
import { Step3React } from "./step-3-react"
import { Step4YourReaction } from "./step-4-your-reaction"
import { Step5QnaIntro } from "./step-5-qna-intro"
import { Step6Ask } from "./step-6-ask"
import { Step7Finish } from "./step-7-finish"

const TOTAL_STEPS = 7

// Fallback reaction shown in step 4 if the user somehow skipped step 3
const DEFAULT_REACTION: UserReaction = {
  name: "Anonymous",
  text: "",
  emoji: "🔥",
}

export function DemoTour() {
  const [step, setStep] = useState(0)
  const [userReaction, setUserReaction] = useState<UserReaction | null>(null)

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  const skip = () => setStep(TOTAL_STEPS - 1)

  const handleReactionSent = (r: UserReaction) => {
    setUserReaction(r)
    next()
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return <Step1Welcome onNext={next} onSkip={skip} />
      case 1:
        return <Step2Wall onNext={next} />
      case 2:
        return <Step3React onReactionSent={handleReactionSent} />
      case 3:
        return (
          <Step4YourReaction
            userReaction={userReaction ?? DEFAULT_REACTION}
            onNext={next}
          />
        )
      case 4:
        return <Step5QnaIntro onNext={next} />
      case 5:
        return <Step6Ask onNext={next} />
      case 6:
        return <Step7Finish />
      default:
        return <Step7Finish />
    }
  }

  return (
    <div className="relative" style={{ height: "100dvh", overflow: "hidden" }}>
      <TourProgress step={step} total={TOTAL_STEPS} />
      {/* key={step} forces remount → triggers the slide-in-from-bottom animation */}
      <div key={step} style={{ height: "100dvh" }}>
        {renderStep()}
      </div>
    </div>
  )
}
