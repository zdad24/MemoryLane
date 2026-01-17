"use client"

import { useState, useRef, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { ChatMessageComponent } from "@/components/chat/chat-message"
import { ChatInput } from "@/components/chat/chat-input"
import { SuggestionChips } from "@/components/chat/suggestion-chips"
import { VideoPlayerModal } from "@/components/library/video-player-modal"
import { type ChatMessage, mockConversations } from "@/lib/chat-data"
import { mockVideos, type VideoMetadata, type EmotionType } from "@/lib/mock-data"
import { MessageSquare, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// Mock AI responses
const mockResponses: Record<string, { content: string; videos?: string[]; emotions?: Record<EmotionType, number> }> = {
  "2023": {
    content:
      "Looking at your memories from 2023, you had a truly remarkable year! You captured 85 videos totaling over 6 hours of memories. Your emotional profile shows you experienced high levels of joy (35%) and love (28%), especially during summer months. Key highlights include your wedding in June, Sarah's birthday party in September, and memorable holiday gatherings in December.",
    videos: ["4", "3", "5"],
    emotions: { joy: 35, love: 28, excitement: 18, calm: 12, nostalgia: 7, sadness: 0 },
  },
  happiest: {
    content:
      "Based on my analysis of your videos, your happiest moments were concentrated around July 2023! The summer BBQ at the lake shows particularly high joy indicators, with lots of laughter detected throughout the video. Your wedding in June also ranks extremely high on the happiness scale.",
    videos: ["1", "4"],
    emotions: { joy: 55, love: 25, excitement: 15, calm: 5, nostalgia: 0, sadness: 0 },
  },
  birthday: {
    content:
      "I found birthday celebration videos in your collection! Sarah's 30th Birthday stands out with high excitement and joy levels. The surprise reveal moment at 2:00 shows peak emotional intensity. Would you like me to create a highlight reel from this celebration?",
    videos: ["3"],
    emotions: { joy: 40, excitement: 45, love: 10, calm: 5, nostalgia: 0, sadness: 0 },
  },
  summer: {
    content:
      "Your summer memories are beautiful! I found several videos from summer 2023 including the lake BBQ and beach sunset walk. These videos show predominantly calm and joyful emotions, with the beach sunset being particularly peaceful. The outdoor activities seem to bring you a lot of happiness!",
    videos: ["1", "2", "8"],
    emotions: { joy: 35, calm: 30, excitement: 20, love: 10, nostalgia: 5, sadness: 0 },
  },
  calm: {
    content:
      "I've found your most peaceful moments. The Beach Sunset Walk has the highest calm emotion score in your collection, followed by the camping trip under the stars. These videos feature natural settings and relaxed atmospheres - perfect for when you need a moment of tranquility.",
    videos: ["2", "8"],
    emotions: { calm: 50, nostalgia: 20, joy: 20, love: 10, excitement: 0, sadness: 0 },
  },
  default: {
    content:
      "I analyzed your video collection and found some related memories. Your videos show a beautiful mix of family moments, celebrations, and peaceful times. Is there something specific you'd like to know more about?",
    videos: ["1", "3", "6"],
    emotions: { joy: 30, love: 25, excitement: 20, calm: 15, nostalgia: 10, sadness: 0 },
  },
}

function getAIResponse(query: string): { content: string; videos?: string[]; emotions?: Record<EmotionType, number> } {
  const queryLower = query.toLowerCase()

  if (queryLower.includes("2023") || queryLower.includes("like")) return mockResponses["2023"]
  if (queryLower.includes("happ") || queryLower.includes("best")) return mockResponses["happiest"]
  if (queryLower.includes("birthday") || queryLower.includes("celebrat")) return mockResponses["birthday"]
  if (queryLower.includes("summer") || queryLower.includes("vacation")) return mockResponses["summer"]
  if (queryLower.includes("calm") || queryLower.includes("peace")) return mockResponses["calm"]

  return mockResponses["default"]
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockConversations)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: "typing",
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isTyping: true,
    }
    setMessages((prev) => [...prev, typingMessage])

    // Simulate AI response
    setTimeout(() => {
      const response = getAIResponse(content)
      const attachedVideos = response.videos?.map((id) => mockVideos.find((v) => v.id === id)).filter(Boolean) as
        | VideoMetadata[]
        | undefined

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
        attachedVideos,
        emotionBreakdown: response.emotions,
      }

      setMessages((prev) => prev.filter((m) => m.id !== "typing").concat(aiMessage))
      setIsLoading(false)
    }, 2000)
  }

  const handleClearChat = () => {
    setMessages(mockConversations)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col pt-20">
        {/* Header */}
        <div className="border-b border-border px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  Ask Your Life
                </h1>
                <p className="text-xs text-muted-foreground">AI-powered memory exploration</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClearChat} className="text-muted-foreground">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear chat
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <ChatMessageComponent key={message.id} message={message} onVideoClick={setSelectedVideo} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggestions (show only if few messages) */}
        {messages.length <= 2 && (
          <div className="px-4 pb-4">
            <div className="max-w-3xl mx-auto">
              <SuggestionChips onSelect={handleSend} />
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border px-4 py-4 bg-background/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            <ChatInput onSend={handleSend} isLoading={isLoading} />
          </div>
        </div>
      </main>

      {/* Video modal */}
      {selectedVideo && <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
    </div>
  )
}
