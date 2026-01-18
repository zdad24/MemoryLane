"use client"

import { useState, useRef, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { ChatMessageComponent } from "@/components/chat/chat-message"
import { ChatInput } from "@/components/chat/chat-input"
import { SuggestionChips } from "@/components/chat/suggestion-chips"
import { VideoPlayerModal } from "@/components/library/video-player-modal"
import { type ChatMessage, mockConversations } from "@/lib/chat-data"
import { api, type Video, type AttachedVideo } from "@/lib/api"
import { MessageSquare, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockConversations)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (content: string) => {
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

    try {
      const response = await api.chat(content, conversationId || undefined)
      setConversationId(response.conversationId)

      const attachedVideos = (response.attachedVideos || []).map((video: AttachedVideo) => ({
        ...video,
        uploadedAt: video.uploadedAt ? new Date(video.uploadedAt) : new Date(),
      }))

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message.content,
        timestamp: new Date(),
        attachedVideos,
      }

      setMessages((prev) => prev.filter((m) => m.id !== "typing").concat(aiMessage))
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I couldn't process that right now. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => prev.filter((m) => m.id !== "typing").concat(errorMessage))
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearChat = () => {
    setMessages(mockConversations)
    setConversationId(null)
  }

  const handleVideoClick = async (video: AttachedVideo) => {
    try {
      const fullVideo = await api.getVideo(video.id)
      setSelectedVideo(fullVideo)
    } catch (error) {
      console.error("Failed to load video details:", error)
    }
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
              <ChatMessageComponent key={message.id} message={message} onVideoClick={handleVideoClick} />
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
