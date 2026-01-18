"use client"

import { Film, Clock, Smile, Calendar } from "lucide-react"
import type { TimelineDataPoint, TimelineSummary, EmotionType } from "@/lib/api"

const emotionColors: Record<EmotionType, { bg: string; text: string }> = {
  joy: { bg: "bg-[#FFD93D]", text: "text-[#FFD93D]" },
  love: { bg: "bg-[#FF6B6B]", text: "text-[#FF6B6B]" },
  excitement: { bg: "bg-[#C44DFF]", text: "text-[#C44DFF]" },
  calm: { bg: "bg-[#4DFFDB]", text: "text-[#4DFFDB]" },
  nostalgia: { bg: "bg-[#FFB066]", text: "text-[#FFB066]" },
  sadness: { bg: "bg-[#5DA3FA]", text: "text-[#5DA3FA]" },
}

interface TimelineStatsProps {
  summary: TimelineSummary;
  dataPoints: TimelineDataPoint[];
}

export function TimelineStats({ summary, dataPoints }: TimelineStatsProps) {
  const totalMinutes = Math.round(summary.totalDuration / 60);
  const months = dataPoints.length;

  const dominantEmotionColor = summary.dominantEmotion
    ? emotionColors[summary.dominantEmotion]?.text || "text-primary"
    : "text-muted";

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
      icon: Smile,
      label: "Top Emotion",
      value: summary.dominantEmotion
        ? summary.dominantEmotion.charAt(0).toUpperCase() + summary.dominantEmotion.slice(1)
        : "N/A",
      color: dominantEmotionColor,
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
