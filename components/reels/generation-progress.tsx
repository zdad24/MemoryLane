"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Film, Sparkles, Music, Scissors } from "lucide-react"
import { cn } from "@/lib/utils"

interface GenerationProgressProps {
  onComplete: () => void
}

const steps = [
  { id: 1, label: "Analyzing videos", icon: Film },
  { id: 2, label: "Selecting best moments", icon: Sparkles },
  { id: 3, label: "Applying transitions", icon: Scissors },
  { id: 4, label: "Adding music", icon: Music },
]

export function GenerationProgress({ onComplete }: GenerationProgressProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 500)
          return 100
        }
        return prev + 2
      })
    }, 150)

    return () => clearInterval(interval)
  }, [onComplete])

  useEffect(() => {
    setCurrentStep(Math.min(Math.floor(progress / 25), steps.length - 1))
  }, [progress])

  return (
    <div className="max-w-lg mx-auto text-center">
      {/* Main progress */}
      <div className="relative mb-8">
        <div className="w-32 h-32 mx-auto relative">
          {/* Outer ring */}
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="58" fill="none" stroke="var(--secondary)" strokeWidth="8" />
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="8"
              strokeDasharray={364}
              strokeDashoffset={364 - (364 * progress) / 100}
              strokeLinecap="round"
              className="transition-all duration-200"
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-8">
        {steps.map((step, index) => {
          const isComplete = index < currentStep
          const isCurrent = index === currentStep
          const Icon = step.icon

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                isComplete
                  ? "bg-primary/10 text-foreground"
                  : isCurrent
                    ? "bg-card border border-primary text-foreground"
                    : "bg-secondary/50 text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isComplete ? "bg-primary text-primary-foreground" : isCurrent ? "bg-primary/20" : "bg-secondary",
                )}
              >
                {isComplete ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={cn("flex-1 text-left text-sm font-medium", isCurrent && "text-primary")}>
                {step.label}
              </span>
              {isCurrent && !isComplete && (
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              )}
            </div>
          )
        })}
      </div>

      {/* Linear progress */}
      <Progress value={progress} className="h-2" />
      <p className="text-sm text-muted-foreground mt-2">Creating your highlight reel...</p>
    </div>
  )
}
