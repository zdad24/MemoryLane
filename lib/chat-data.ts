import type { VideoMetadata, EmotionType } from "./mock-data"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  attachedVideos?: VideoMetadata[]
  emotionBreakdown?: Record<EmotionType, number>
  isTyping?: boolean
}

export const exampleQuestions = [
  "What was I like in 2023?",
  "Show me all videos with my dog",
  "When was I happiest last year?",
  "Find videos from birthday celebrations",
  "What were my best summer moments?",
  "Show me peaceful and calm moments",
]

export const mockConversations: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hi! I'm your MemoryLane AI assistant. I can help you explore your video memories, answer questions about your life, and create highlight reels. What would you like to know about your memories?",
    timestamp: new Date(),
  },
]
