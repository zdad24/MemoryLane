"use client"

import { cn } from "@/lib/utils"
import { getEmotionColor } from "@/lib/mock-data"

interface EmotionFilterProps {
  selected: string | "all"
  onChange: (emotion: string | "all") => void
  emotions: string[]
  counts?: Record<string, number>
}

export function EmotionFilter({ selected, onChange, emotions, counts }: EmotionFilterProps) {
  const allEmotions = ["all", ...emotions]

  return (
    <div className="flex flex-wrap gap-2">
      {allEmotions.map((emotion) => {
        const isSelected = selected === emotion
        const colors = emotion !== "all" ? getEmotionColor(emotion) : null

        return (
          <button
            key={emotion}
            onClick={() => onChange(emotion)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
              "flex items-center gap-2",
              isSelected
                ? emotion === "all"
                  ? "bg-primary text-primary-foreground"
                  : `${colors?.bg} ${colors?.text}`
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
          >
            <span className="capitalize">{emotion === "all" ? "All Videos" : emotion}</span>
            {counts && counts[emotion] !== undefined && (
              <span
                className={cn("text-xs px-1.5 py-0.5 rounded-full", isSelected ? "bg-black/20" : "bg-foreground/10")}
              >
                {counts[emotion]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
