"use client"
import { Play, Bot, User } from "lucide-react"
import type { ChatMessage } from "@/lib/chat-data"
import { type VideoMetadata, emotionColors } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: ChatMessage
  onVideoClick?: (video: VideoMetadata) => void
}

export function ChatMessageComponent({ message, onVideoClick }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          isUser ? "bg-primary" : "bg-gradient-to-br from-[#667eea] to-[#764ba2]",
        )}
      >
        {isUser ? <User className="w-5 h-5 text-primary-foreground" /> : <Bot className="w-5 h-5 text-white" />}
      </div>

      {/* Message content */}
      <div className={cn("flex flex-col max-w-[80%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border rounded-tl-sm",
          )}
        >
          {message.isTyping ? (
            <div className="flex items-center gap-1 py-1">
              <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <p className={cn("text-sm leading-relaxed", isUser ? "text-primary-foreground" : "text-foreground")}>
              {message.content}
            </p>
          )}
        </div>

        {/* Attached videos */}
        {message.attachedVideos && message.attachedVideos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.attachedVideos.map((video) => {
              const colors = emotionColors[video.emotion]
              return (
                <button
                  key={video.id}
                  onClick={() => onVideoClick?.(video)}
                  className="group flex items-center gap-2 p-2 rounded-xl bg-card border border-border 
                    hover:border-primary/50 transition-all duration-200"
                >
                  <div className="relative w-20 h-12 rounded-lg overflow-hidden">
                    <img
                      src={video.thumbnail || "/placeholder.svg"}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                    <div className={cn("absolute bottom-0 left-0 right-0 h-1", colors.bg)} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium text-foreground line-clamp-1 max-w-[120px]">{video.title}</p>
                    <p className="text-xs text-muted-foreground">{video.duration}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Emotion breakdown chart */}
        {message.emotionBreakdown && (
          <div className="mt-3 p-4 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-3">Emotion Breakdown</p>
            <div className="space-y-2">
              {Object.entries(message.emotionBreakdown).map(([emotion, value]) => {
                const colors = emotionColors[emotion as keyof typeof emotionColors]
                return (
                  <div key={emotion} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16 capitalize">{emotion}</span>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", colors.bg)}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">{value}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground mt-1">
          {message.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  )
}
