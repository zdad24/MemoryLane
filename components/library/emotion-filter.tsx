"use client"

import { cn } from "@/lib/utils"
import { type EmotionType, emotionColors } from "@/lib/mock-data"
import { Smile, Heart, Leaf, Zap, Clock, CloudRain } from "lucide-react"

interface EmotionFilterProps {
  selected: EmotionType | "all"
  onChange: (emotion: EmotionType | "all") => void
  counts?: Record<EmotionType | "all", number>
}

const emotionIcons: Record<EmotionType, typeof Smile> = {
  joy: Smile,
  love: Heart,
  calm: Leaf,
  excitement: Zap,
  nostalgia: Clock,
  sadness: CloudRain,
}

const emotions: (EmotionType | "all")[] = ["all", "joy", "love", "calm", "excitement", "nostalgia", "sadness"]

export function EmotionFilter({ selected, onChange, counts }: EmotionFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {emotions.map((emotion) => {
        const isSelected = selected === emotion
        const colors = emotion !== "all" ? emotionColors[emotion] : null
        const Icon = emotion !== "all" ? emotionIcons[emotion] : null

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
            {Icon && <Icon className="w-4 h-4" />}
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
