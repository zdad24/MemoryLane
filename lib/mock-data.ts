export type EmotionType = "joy" | "love" | "calm" | "excitement" | "nostalgia" | "sadness"

export interface VideoMetadata {
  id: string
  title: string
  thumbnail: string
  duration: string
  durationSeconds: number
  date: string
  emotion: EmotionType
  emotionScore: number
  summary: string
  tags: string[]
}

export interface Moment {
  id: string
  videoId: string
  startTime: number
  endTime: number
  description: string
  emotion: EmotionType
  thumbnail: string
  confidence: number
}

export const emotionColors: Record<EmotionType, { bg: string; text: string; border: string; glow: string }> = {
  joy: {
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
  calm: {
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
  nostalgia: {
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
}

export const mockVideos: VideoMetadata[] = [
  {
    id: "1",
    title: "Summer BBQ at the Lake",
    thumbnail: "/family-laughing-at-dinner.jpg",
    duration: "5:34",
    durationSeconds: 334,
    date: "Jul 15, 2023",
    emotion: "joy",
    emotionScore: 0.92,
    summary: "Family gathering with laughter, grilling, and swimming at the lake house.",
    tags: ["family", "summer", "outdoor", "celebration"],
  },
  {
    id: "2",
    title: "Beach Sunset Walk",
    thumbnail: "/kids-playing-at-beach.jpg",
    duration: "3:21",
    durationSeconds: 201,
    date: "Aug 22, 2023",
    emotion: "calm",
    emotionScore: 0.88,
    summary: "Peaceful evening walk along the beach watching the sunset.",
    tags: ["beach", "sunset", "relaxation", "nature"],
  },
  {
    id: "3",
    title: "Sarah's 30th Birthday",
    thumbnail: "/birthday-party.png",
    duration: "12:45",
    durationSeconds: 765,
    date: "Sep 5, 2023",
    emotion: "excitement",
    emotionScore: 0.95,
    summary: "Surprise birthday party with friends, cake cutting, and dancing.",
    tags: ["birthday", "party", "celebration", "friends"],
  },
  {
    id: "4",
    title: "Wedding Day - First Dance",
    thumbnail: "/romantic-wedding-first-dance.jpg",
    duration: "4:18",
    durationSeconds: 258,
    date: "Jun 10, 2023",
    emotion: "love",
    emotionScore: 0.98,
    summary: "Beautiful first dance as husband and wife.",
    tags: ["wedding", "love", "dance", "milestone"],
  },
  {
    id: "5",
    title: "Grandpa's Stories",
    thumbnail: "/elderly-grandpa-telling-stories-warm.jpg",
    duration: "18:22",
    durationSeconds: 1102,
    date: "Dec 25, 2022",
    emotion: "nostalgia",
    emotionScore: 0.87,
    summary: "Christmas dinner where grandpa shared stories from his youth.",
    tags: ["family", "christmas", "memories", "grandparents"],
  },
  {
    id: "6",
    title: "Baby's First Steps",
    thumbnail: "/baby-taking-first-steps-happy-parents.jpg",
    duration: "2:15",
    durationSeconds: 135,
    date: "Mar 18, 2024",
    emotion: "joy",
    emotionScore: 0.99,
    summary: "Little Emma took her first steps in the living room!",
    tags: ["baby", "milestone", "first steps", "family"],
  },
  {
    id: "7",
    title: "Graduation Day",
    thumbnail: "/graduation-ceremony-cap-gown-celebration.jpg",
    duration: "8:45",
    durationSeconds: 525,
    date: "May 20, 2023",
    emotion: "excitement",
    emotionScore: 0.93,
    summary: "College graduation ceremony and celebrations with family.",
    tags: ["graduation", "achievement", "celebration", "education"],
  },
  {
    id: "8",
    title: "Camping Under Stars",
    thumbnail: "/camping-night-starry-sky-tent-cozy.jpg",
    duration: "6:30",
    durationSeconds: 390,
    date: "Jul 4, 2023",
    emotion: "calm",
    emotionScore: 0.85,
    summary: "Peaceful night camping with friends, stargazing and campfire stories.",
    tags: ["camping", "nature", "friends", "night"],
  },
  {
    id: "9",
    title: "Anniversary Dinner",
    thumbnail: "/romantic-dinner-couple-anniversary-restaurant.jpg",
    duration: "4:55",
    durationSeconds: 295,
    date: "Feb 14, 2024",
    emotion: "love",
    emotionScore: 0.91,
    summary: "10th wedding anniversary dinner at our favorite restaurant.",
    tags: ["anniversary", "love", "dinner", "couple"],
  },
]

export const mockMoments: Moment[] = [
  {
    id: "m1",
    videoId: "1",
    startTime: 45,
    endTime: 60,
    description: "Everyone laughing at dad's joke",
    emotion: "joy",
    thumbnail: "/family-laughing-at-dinner.jpg",
    confidence: 0.94,
  },
  {
    id: "m2",
    videoId: "1",
    startTime: 180,
    endTime: 210,
    description: "Kids jumping into the lake",
    emotion: "excitement",
    thumbnail: "/kids-playing-at-beach.jpg",
    confidence: 0.89,
  },
  {
    id: "m3",
    videoId: "3",
    startTime: 120,
    endTime: 150,
    description: "Surprise reveal - everyone shouting",
    emotion: "excitement",
    thumbnail: "/birthday-party.png",
    confidence: 0.97,
  },
]
