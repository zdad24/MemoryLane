// Legacy type for backward compatibility - now accepts any string
export type EmotionType = string

// Known emotion colors for common emotions
const knownEmotionColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  joy: {
    bg: "bg-[#FFD93D]",
    text: "text-black",
    border: "border-[#FFD93D]",
    glow: "shadow-[#FFD93D]/30",
  },
  joyful: {
    bg: "bg-[#FFD93D]",
    text: "text-black",
    border: "border-[#FFD93D]",
    glow: "shadow-[#FFD93D]/30",
  },
  love: {
    bg: "bg-[#FF6B9D]",
    text: "text-white",
    border: "border-[#FF6B9D]",
    glow: "shadow-[#FF6B9D]/30",
  },
  loving: {
    bg: "bg-[#FF6B9D]",
    text: "text-white",
    border: "border-[#FF6B9D]",
    glow: "shadow-[#FF6B9D]/30",
  },
  heartwarming: {
    bg: "bg-[#FF6B9D]",
    text: "text-white",
    border: "border-[#FF6B9D]",
    glow: "shadow-[#FF6B9D]/30",
  },
  calm: {
    bg: "bg-[#6BCB77]",
    text: "text-white",
    border: "border-[#6BCB77]",
    glow: "shadow-[#6BCB77]/30",
  },
  peaceful: {
    bg: "bg-[#6BCB77]",
    text: "text-white",
    border: "border-[#6BCB77]",
    glow: "shadow-[#6BCB77]/30",
  },
  serene: {
    bg: "bg-[#6BCB77]",
    text: "text-white",
    border: "border-[#6BCB77]",
    glow: "shadow-[#6BCB77]/30",
  },
  relaxed: {
    bg: "bg-[#6BCB77]",
    text: "text-white",
    border: "border-[#6BCB77]",
    glow: "shadow-[#6BCB77]/30",
  },
  excitement: {
    bg: "bg-[#FF8C42]",
    text: "text-white",
    border: "border-[#FF8C42]",
    glow: "shadow-[#FF8C42]/30",
  },
  excited: {
    bg: "bg-[#FF8C42]",
    text: "text-white",
    border: "border-[#FF8C42]",
    glow: "shadow-[#FF8C42]/30",
  },
  energetic: {
    bg: "bg-[#FF8C42]",
    text: "text-white",
    border: "border-[#FF8C42]",
    glow: "shadow-[#FF8C42]/30",
  },
  adventurous: {
    bg: "bg-[#FF8C42]",
    text: "text-white",
    border: "border-[#FF8C42]",
    glow: "shadow-[#FF8C42]/30",
  },
  nostalgia: {
    bg: "bg-[#9D84B7]",
    text: "text-white",
    border: "border-[#9D84B7]",
    glow: "shadow-[#9D84B7]/30",
  },
  nostalgic: {
    bg: "bg-[#9D84B7]",
    text: "text-white",
    border: "border-[#9D84B7]",
    glow: "shadow-[#9D84B7]/30",
  },
  bittersweet: {
    bg: "bg-[#9D84B7]",
    text: "text-white",
    border: "border-[#9D84B7]",
    glow: "shadow-[#9D84B7]/30",
  },
  sadness: {
    bg: "bg-[#4A5568]",
    text: "text-white",
    border: "border-[#4A5568]",
    glow: "shadow-[#4A5568]/30",
  },
  sad: {
    bg: "bg-[#4A5568]",
    text: "text-white",
    border: "border-[#4A5568]",
    glow: "shadow-[#4A5568]/30",
  },
  melancholic: {
    bg: "bg-[#4A5568]",
    text: "text-white",
    border: "border-[#4A5568]",
    glow: "shadow-[#4A5568]/30",
  },
  festive: {
    bg: "bg-[#E91E63]",
    text: "text-white",
    border: "border-[#E91E63]",
    glow: "shadow-[#E91E63]/30",
  },
  playful: {
    bg: "bg-[#00BCD4]",
    text: "text-white",
    border: "border-[#00BCD4]",
    glow: "shadow-[#00BCD4]/30",
  },
  tender: {
    bg: "bg-[#F48FB1]",
    text: "text-white",
    border: "border-[#F48FB1]",
    glow: "shadow-[#F48FB1]/30",
  },
  cozy: {
    bg: "bg-[#8D6E63]",
    text: "text-white",
    border: "border-[#8D6E63]",
    glow: "shadow-[#8D6E63]/30",
  },
  triumphant: {
    bg: "bg-[#FFC107]",
    text: "text-black",
    border: "border-[#FFC107]",
    glow: "shadow-[#FFC107]/30",
  },
  intimate: {
    bg: "bg-[#7B1FA2]",
    text: "text-white",
    border: "border-[#7B1FA2]",
    glow: "shadow-[#7B1FA2]/30",
  },
}

// Default color for unknown emotions
const defaultEmotionColor = {
  bg: "bg-secondary",
  text: "text-secondary-foreground",
  border: "border-secondary",
  glow: "shadow-secondary/30",
}

// Get color for any emotion tag (with fallback)
export function getEmotionColor(emotion: string): { bg: string; text: string; border: string; glow: string } {
  const normalized = emotion.toLowerCase().trim()
  return knownEmotionColors[normalized] || defaultEmotionColor
}

// Export for backward compatibility
export const emotionColors = knownEmotionColors

// Video metadata type for timeline/milestone views
export interface VideoMetadata {
  id: string
  title: string
  thumbnail?: string
  duration?: string
  date?: string
  emotions?: EmotionType[]
  storageUrl?: string
  summary?: string
}
