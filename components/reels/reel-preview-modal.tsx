"use client"

import { useState } from "react"
import { X, Play, Pause, Download, Share2, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import type { HighlightReel } from "@/lib/reel-data"
import { emotionColors, type EmotionType } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface ReelPreviewModalProps {
  reel: HighlightReel
  onClose: () => void
}

export function ReelPreviewModal({ reel, onClose }: ReelPreviewModalProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  const progress = (currentTime / reel.durationSeconds) * 100

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video container */}
        <div className="rounded-2xl overflow-hidden bg-black">
          {/* Video/Image preview */}
          <div className="relative aspect-video">
            {/* Slideshow of thumbnails as preview */}
            <img
              src={reel.thumbnails[Math.floor(currentTime / 30) % reel.thumbnails.length] || "/placeholder.svg"}
              alt={reel.title}
              className="w-full h-full object-cover"
            />

            {/* Play overlay */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                {isPlaying ? (
                  <Pause className="w-10 h-10 text-white" />
                ) : (
                  <Play className="w-10 h-10 text-white ml-1" />
                )}
              </div>
            </button>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              {/* Progress bar */}
              <Slider
                value={[progress]}
                max={100}
                step={0.1}
                onValueChange={([value]) => setCurrentTime((value / 100) * reel.durationSeconds)}
                className="mb-4"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>

                  <span className="text-white text-sm font-mono">
                    {formatTime(currentTime)} / {reel.duration}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <Download className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 flex items-center justify-between text-white">
          <div>
            <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              {reel.title}
            </h2>
            <p className="text-sm text-white/60">
              {reel.videoCount} videos • Created {reel.createdAt.toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            {reel.emotions.map((emotion) => {
              const colors = emotionColors[emotion as EmotionType]
              return (
                <span key={emotion} className={cn("px-3 py-1 rounded-full text-sm capitalize", colors.bg, colors.text)}>
                  {emotion}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
