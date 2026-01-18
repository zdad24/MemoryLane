export interface HighlightReel {
  id: string
  title: string
  duration: string
  durationSeconds: number
  emotions: string[]
  videoCount: number
  thumbnails: string[]
  createdAt: Date
  status: "generating" | "completed" | "failed"
  progress?: number
}

export const musicOptions = [
  { id: "none", name: "No Music", description: "Just your memories" },
  { id: "upbeat", name: "Upbeat", description: "Energetic and fun" },
  { id: "emotional", name: "Emotional", description: "Heartfelt and moving" },
  { id: "calm", name: "Calm", description: "Peaceful and relaxing" },
  { id: "cinematic", name: "Cinematic", description: "Epic and dramatic" },
]

export const transitionOptions = [
  { id: "crossfade", name: "Cross Dissolve", description: "Smooth blend" },
  { id: "fade", name: "Fade to Black", description: "Classic transition" },
  { id: "swipe", name: "Swipe", description: "Modern slide effect" },
  { id: "none", name: "Hard Cut", description: "Direct cuts" },
]
