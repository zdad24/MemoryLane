"use client"

import { useState, useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { type TimelineDataPoint, type Milestone, milestoneIcons } from "@/lib/timeline-data"
import type { EmotionType } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface EmotionalChartProps {
  data: TimelineDataPoint[]
  milestones: Milestone[]
  selectedEmotions: EmotionType[]
  onMilestoneClick: (milestone: Milestone) => void
}

const emotionChartColors: Record<EmotionType, string> = {
  joy: "#FFD93D",
  love: "#FF6B9D",
  calm: "#6BCB77",
  excitement: "#FF8C42",
  nostalgia: "#9D84B7",
  sadness: "#4A5568",
}

const CHART_COLORS = {
  grid: "#2a2a3e",
  axis: "#a0a0a0",
  card: "#1a1a2e",
  cardForeground: "#eaeaea",
  muted: "#a0a0a0",
  border: "#2a2a3e",
}

export function EmotionalChart({ data, milestones, selectedEmotions, onMilestoneClick }: EmotionalChartProps) {
  const [hoveredMilestone, setHoveredMilestone] = useState<string | null>(null)

  // Find the x-position for each milestone
  const milestonePositions = useMemo(() => {
    return milestones.map((m) => {
      const monthMatch = data.find((d) => m.date.startsWith(d.date))
      return {
        ...m,
        dataIndex: monthMatch ? data.indexOf(monthMatch) : -1,
        x: monthMatch?.month || "",
      }
    })
  }, [milestones, data])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = data.find((d) => d.month === label)
      return (
        <div
          className="rounded-xl p-4 shadow-lg"
          style={{
            backgroundColor: CHART_COLORS.card,
            border: `1px solid ${CHART_COLORS.border}`,
          }}
        >
          <p className="font-semibold mb-2" style={{ color: CHART_COLORS.cardForeground }}>
            {label} {dataPoint?.year}
          </p>
          <p className="text-sm mb-3" style={{ color: CHART_COLORS.muted }}>
            {dataPoint?.videoCount} videos
          </p>
          <div className="space-y-1">
            {payload.map((entry: any) => (
              <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="capitalize" style={{ color: CHART_COLORS.cardForeground }}>
                    {entry.dataKey}
                  </span>
                </div>
                <span className="font-mono" style={{ color: CHART_COLORS.muted }}>
                  {entry.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            {(Object.keys(emotionChartColors) as EmotionType[]).map((emotion) => (
              <linearGradient key={emotion} id={`gradient-${emotion}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={emotionChartColors[emotion]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={emotionChartColors[emotion]} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} opacity={0.5} />
          <XAxis dataKey="month" stroke={CHART_COLORS.axis} fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke={CHART_COLORS.axis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            allowDataOverflow={true}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Milestone reference lines */}
          {milestonePositions
            .filter((m) => m.dataIndex >= 0)
            .map((milestone) => (
              <ReferenceLine
                key={milestone.id}
                x={milestone.x}
                stroke={emotionChartColors[milestone.emotion]}
                strokeDasharray="5 5"
                strokeWidth={2}
                opacity={hoveredMilestone === milestone.id ? 1 : 0.5}
              />
            ))}

          {/* Area charts for each emotion */}
          {selectedEmotions.map((emotion) => (
            <Area
              key={emotion}
              type="monotone"
              dataKey={emotion}
              stackId="1"
              stroke={emotionChartColors[emotion]}
              fill={`url(#gradient-${emotion})`}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Milestone markers */}
      <div className="absolute top-0 left-0 right-0 h-full pointer-events-none">
        <div className="relative h-full">
          {milestonePositions
            .filter((m) => m.dataIndex >= 0)
            .map((milestone) => {
              const position = ((milestone.dataIndex + 0.5) / data.length) * 100
              return (
                <button
                  key={milestone.id}
                  className={cn(
                    "absolute top-2 transform -translate-x-1/2 pointer-events-auto",
                    "w-8 h-8 rounded-full flex items-center justify-center text-lg",
                    "transition-all duration-200 hover:scale-125",
                    hoveredMilestone === milestone.id ? "scale-125 z-10" : "",
                  )}
                  style={{
                    left: `calc(${position}% + 30px)`,
                    backgroundColor: emotionChartColors[milestone.emotion],
                  }}
                  onMouseEnter={() => setHoveredMilestone(milestone.id)}
                  onMouseLeave={() => setHoveredMilestone(null)}
                  onClick={() => onMilestoneClick(milestone)}
                  title={milestone.title}
                >
                  {milestoneIcons[milestone.type]}
                </button>
              )
            })}
        </div>
      </div>
    </div>
  )
}
