"use client"

import { Film, Clock, Tag, Calendar } from "lucide-react"
import { getEmotionColor } from "@/lib/mock-data"
import { type TimelineSummary } from "@/lib/api"

interface TimelineStatsProps {
  summary: TimelineSummary
}

export function TimelineStats({ summary }: TimelineStatsProps) {
  const totalMinutes = Math.round(summary.totalDuration / 60)
  const topEmotion = summary.topEmotionTags[0] || "none"
  const colors = getEmotionColor(topEmotion)

  const stats = [
    {
      icon: Film,
      label: "Videos",
      value: summary.totalVideos,
      color: "text-primary",
    },
    {
      icon: Clock,
      label: "Minutes",
      value: totalMinutes,
      color: "text-[#FFD93D]",
    },
    {
      icon: Tag,
      label: "Top Emotion",
      value: topEmotion.charAt(0).toUpperCase() + topEmotion.slice(1),
      color: colors.bg.replace("bg-", "text-"),
    },
    {
      icon: Calendar,
      label: "Total Tags",
      value: Object.keys(summary.emotionBreakdown).length,
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
