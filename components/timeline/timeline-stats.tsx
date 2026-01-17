"use client"

import { Film, Clock, Smile, Calendar } from "lucide-react"
import { mockVideos, type EmotionType, emotionColors } from "@/lib/mock-data"

export function TimelineStats() {
  // Calculate stats
  const totalVideos = mockVideos.length
  const totalMinutes = Math.round(mockVideos.reduce((acc, v) => acc + v.durationSeconds, 0) / 60)

  // Count emotions
  const emotionCounts = mockVideos.reduce(
    (acc, video) => {
      acc[video.emotion] = (acc[video.emotion] || 0) + 1
      return acc
    },
    {} as Record<EmotionType, number>,
  )

  // Find dominant emotion
  const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]
  const colors = emotionColors[dominantEmotion[0] as EmotionType]

  // Calculate date range
  const dates = mockVideos.map((v) => new Date(v.date))
  const startDate = new Date(Math.min(...dates.map((d) => d.getTime())))
  const endDate = new Date(Math.max(...dates.map((d) => d.getTime())))
  const months = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))

  const stats = [
    {
      icon: Film,
      label: "Videos",
      value: totalVideos,
      color: "text-primary",
    },
    {
      icon: Clock,
      label: "Minutes",
      value: totalMinutes,
      color: "text-[#FFD93D]",
    },
    {
      icon: Smile,
      label: "Top Emotion",
      value: dominantEmotion[0].charAt(0).toUpperCase() + dominantEmotion[0].slice(1),
      color: colors.bg.replace("bg-", "text-"),
    },
    {
      icon: Calendar,
      label: "Time Span",
      value: `${months} months`,
      color: "text-[#6BCB77]",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
          <div className={`p-3 rounded-xl bg-secondary ${stat.color}`}>
            <stat.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              {stat.value}
            </p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
