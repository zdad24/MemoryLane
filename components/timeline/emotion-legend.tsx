"use client"

import { getEmotionColor } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface EmotionLegendProps {
  emotions: string[]
  selectedEmotions: string[]
  onToggle: (emotion: string) => void
}

export function EmotionLegend({ emotions, selectedEmotions, onToggle }: EmotionLegendProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {emotions.map((emotion) => {
        const isSelected = selectedEmotions.includes(emotion)
        const colors = getEmotionColor(emotion)

        return (
          <button
            key={emotion}
            onClick={() => onToggle(emotion)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
              isSelected
                ? `${colors.bg} ${colors.text} shadow-lg ${colors.glow}`
                : "bg-secondary text-muted-foreground hover:bg-secondary/80",
            )}
          >
            <span className="capitalize">{emotion}</span>
          </button>
        )
      })}
    </div>
  )
}
