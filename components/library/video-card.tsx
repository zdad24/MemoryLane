"use client"

import { useState } from "react"
import { Play, Clock, Calendar } from "lucide-react"
import { type VideoMetadata, emotionColors } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface VideoCardProps {
  video: VideoMetadata
  onClick: (video: VideoMetadata) => void
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const colors = emotionColors[video.emotion]

  return (
    <div
      className={cn(
        "group rounded-xl overflow-hidden bg-card border border-border cursor-pointer",
        "transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        isHovered && `hover:${colors.border} ${colors.glow}`,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(video)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={video.thumbnail || "/placeholder.svg"}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Hover overlay */}
        <div
          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 
          transition-opacity duration-300 flex items-center justify-center"
        >
          <div
            className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center
            transform scale-75 group-hover:scale-100 transition-transform duration-300"
          >
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>
        </div>

        {/* Emotion badge */}
        <div
          className={cn(
            "absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold capitalize",
            colors.bg,
            colors.text,
          )}
        >
          {video.emotion}
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/70 text-white text-xs font-mono flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {video.duration}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{video.summary}</p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {video.date}
          </span>
          <div className="flex gap-1">
            {video.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
