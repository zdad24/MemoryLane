import type { EmotionType } from "./mock-data"

export interface TimelineDataPoint {
  date: string
  month: string
  year: number
  joy: number
  love: number
  calm: number
  excitement: number
  nostalgia: number
  sadness: number
  videoCount: number
}

export interface Milestone {
  id: string
  date: string
  type: "birthday" | "wedding" | "graduation" | "vacation" | "birth" | "holiday"
  title: string
  description: string
  videoId?: string
  emotion: EmotionType
}

export const milestoneIcons = {
  birthday: "🎂",
  wedding: "💍",
  graduation: "🎓",
  vacation: "✈️",
  birth: "👶",
  holiday: "🎄",
}
