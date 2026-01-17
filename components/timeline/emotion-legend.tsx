"use client"

import { type EmotionType, emotionColors } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Smile, Heart, Leaf, Zap, Clock, CloudRain } from "lucide-react"

interface EmotionLegendProps {
  selectedEmotions: EmotionType[]
  onToggle: (emotion: EmotionType) => void
}

const emotionIcons: Record<EmotionType, typeof Smile> = {
  joy: Smile,
  love: Heart,
  calm: Leaf,
  excitement: Zap,
  nostalgia: Clock,
  sadness: CloudRain,
}

const emotions: EmotionType[] = ["joy", "love", "calm", "excitement", "nostalgia", "sadness"]

export function EmotionLegend({ selectedEmotions, onToggle }: EmotionLegendProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {emotions.map((emotion) => {
        const isSelected = selectedEmotions.includes(emotion)
        const colors = emotionColors[emotion]
        const Icon = emotionIcons[emotion]

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
            <Icon className="w-4 h-4" />
            <span className="capitalize">{emotion}</span>
          </button>
        )
      })}
    </div>
  )
}
