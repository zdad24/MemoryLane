import type { EmotionType } from "./mock-data"

export interface HighlightReel {
  id: string
  title: string
  duration: string
  durationSeconds: number
  emotions: EmotionType[]
  videoCount: number
  thumbnails: string[]
  createdAt: Date
  status: "generating" | "completed" | "failed"
  progress?: number
}

export const mockReels: HighlightReel[] = [
  {
    id: "1",
    title: "Summer Memories 2023",
    duration: "2:30",
    durationSeconds: 150,
    emotions: ["joy", "excitement", "calm"],
    videoCount: 5,
    thumbnails: [
      "/family-laughing-at-dinner.jpg",
      "/kids-playing-at-beach.jpg",
      "/camping-night-starry-sky-tent-cozy.jpg",
    ],
    createdAt: new Date("2024-01-15"),
    status: "completed",
  },
  {
    id: "2",
    title: "Love & Celebration",
    duration: "3:45",
    durationSeconds: 225,
    emotions: ["love", "joy"],
    videoCount: 4,
    thumbnails: [
      "/romantic-wedding-first-dance.jpg",
      "/birthday-party.png",
      "/romantic-dinner-couple-anniversary-restaurant.jpg",
    ],
    createdAt: new Date("2024-02-10"),
    status: "completed",
  },
  {
    id: "3",
    title: "Family Moments",
    duration: "5:00",
    durationSeconds: 300,
    emotions: ["love", "nostalgia", "joy"],
    videoCount: 6,
    thumbnails: [
      "/elderly-grandpa-telling-stories-warm.jpg",
      "/baby-taking-first-steps-happy-parents.jpg",
      "/graduation-ceremony-cap-gown-celebration.jpg",
    ],
    createdAt: new Date("2024-03-01"),
    status: "completed",
  },
]

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
