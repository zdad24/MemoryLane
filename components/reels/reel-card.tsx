"use client"

import { Play, Clock, Download, Share2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { HighlightReel } from "@/lib/reel-data"
import { getEmotionColor } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface ReelCardProps {
  reel: HighlightReel
  onPlay: () => void
  onDelete: () => void
}

export function ReelCard({ reel, onPlay, onDelete }: ReelCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300 group">
      {/* Thumbnail collage */}
      <div className="relative aspect-video cursor-pointer" onClick={onPlay}>
        <div className="absolute inset-0 grid grid-cols-3 gap-0.5 bg-border">
          {reel.thumbnails.slice(0, 3).map((thumb, index) => (
            <div key={index} className="relative overflow-hidden">
              <img
                src={thumb || "/placeholder.svg"}
                alt=""
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          ))}
        </div>

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/70 text-white text-xs font-mono flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {reel.duration}
        </div>

        {/* Status badge */}
        {reel.status === "generating" && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
            Generating...
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{reel.title}</h3>

        {/* Emotions */}
        <div className="flex flex-wrap gap-1 mb-3">
          {reel.emotions.map((emotion) => {
            const colors = getEmotionColor(emotion)
            return (
              <span key={emotion} className={cn("px-2 py-0.5 rounded-full text-xs capitalize", colors.bg, colors.text)}>
                {emotion}
              </span>
            )
          })}
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>{reel.videoCount} videos</span>
          <span>{reel.createdAt.toLocaleDateString()}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-border bg-transparent hover:bg-secondary"
            onClick={onPlay}
          >
            <Play className="w-4 h-4 mr-1" />
            Play
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
