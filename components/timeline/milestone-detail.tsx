"use client"

import { X, Play, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type Milestone, milestoneIcons } from "@/lib/timeline-data"
import { emotionColors, type EmotionType } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface MilestoneDetailProps {
  milestone: Milestone
  onClose: () => void
  onViewVideo: (videoId: string) => void
}

export function MilestoneDetail({ milestone, onClose, onViewVideo }: MilestoneDetailProps) {
  const colors = emotionColors[milestone.emotion as EmotionType] || emotionColors.joy

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md bg-card border border-border rounded-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className={cn("p-6 relative", colors.bg)}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 transition-colors"
          >
            <X className={cn("w-5 h-5", colors.text)} />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">
              {milestoneIcons[milestone.type] || "📌"}
            </div>
            <div>
              <span className={cn("text-sm font-medium opacity-80", colors.text)}>
                {milestone.type.charAt(0).toUpperCase() + milestone.type.slice(1)}
              </span>
              <h3 className={cn("text-xl font-bold", colors.text)} style={{ fontFamily: "var(--font-space-grotesk)" }}>
                {milestone.title}
              </h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(milestone.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          <p className="text-foreground mb-6">{milestone.description}</p>

          {/* Video action */}
          {milestone.videoId && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Related Video</h4>
              <button
                onClick={() => onViewVideo(milestone.videoId!)}
                className="w-full flex items-center gap-4 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
              >
                <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
                  <Play className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">View Memory</p>
                  <p className="text-sm text-muted-foreground">Click to watch</p>
                </div>
              </button>
            </div>
          )}

          <Button
            className={cn("w-full", colors.bg, colors.text, "hover:opacity-90")}
            onClick={() => {
              if (milestone.videoId) onViewVideo(milestone.videoId)
              else onClose()
            }}
          >
            {milestone.videoId ? "Watch Memory" : "Close"}
          </Button>
        </div>
      </div>
    </div>
  )
}
