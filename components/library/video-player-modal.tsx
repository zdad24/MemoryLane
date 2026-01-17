"use client"

import { useState, useRef, useEffect } from "react"
import { X, Play, Pause, Volume2, VolumeX, Maximize, Share2, ChevronRight, SkipForward, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { type VideoMetadata, emotionColors, mockMoments } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface VideoPlayerModalProps {
  video: VideoMetadata
  startTime?: number
  onClose: () => void
}

export function VideoPlayerModal({ video, startTime = 0, onClose }: VideoPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(startTime)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(80)
  const [showControls, setShowControls] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const relatedMoments = mockMoments.filter((m) => m.videoId === video.id)
  const colors = emotionColors[video.emotion]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === " ") {
        e.preventDefault()
        setIsPlaying(!isPlaying)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose, isPlaying])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }

  const progress = (currentTime / video.durationSeconds) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      {/* Modal content */}
      <div
        className="relative w-full max-w-6xl mx-4 flex flex-col lg:flex-row gap-4 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video player */}
        <div className="flex-1 rounded-2xl overflow-hidden bg-black" onMouseMove={handleMouseMove}>
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white 
              hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Video */}
          <div className="relative aspect-video">
            <img src={video.thumbnail || "/placeholder.svg"} alt={video.title} className="w-full h-full object-cover" />

            {/* Play/Pause overlay */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity",
                showControls ? "opacity-100" : "opacity-0",
              )}
            >
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                {isPlaying ? (
                  <Pause className="w-10 h-10 text-white" />
                ) : (
                  <Play className="w-10 h-10 text-white ml-1" />
                )}
              </div>
            </button>

            {/* Timeline markers for moments */}
            <div className="absolute bottom-16 left-0 right-0 h-1 mx-4">
              {relatedMoments.map((moment) => {
                const position = (moment.startTime / video.durationSeconds) * 100
                const momentColors = emotionColors[moment.emotion]
                return (
                  <button
                    key={moment.id}
                    className={cn(
                      "absolute top-0 w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1",
                      momentColors.bg,
                    )}
                    style={{ left: `${position}%` }}
                    onClick={() => setCurrentTime(moment.startTime)}
                    title={moment.description}
                  />
                )
              })}
            </div>

            {/* Controls */}
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity",
                showControls ? "opacity-100" : "opacity-0",
              )}
            >
              {/* Progress bar */}
              <Slider
                value={[progress]}
                max={100}
                step={0.1}
                onValueChange={([value]) => setCurrentTime((value / 100) * video.durationSeconds)}
                className="mb-4"
              />

              {/* Control buttons */}
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
                    onClick={() => setCurrentTime(Math.min(currentTime + 10, video.durationSeconds))}
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={100}
                      onValueChange={([value]) => {
                        setVolume(value)
                        setIsMuted(value === 0)
                      }}
                      className="w-20"
                    />
                  </div>

                  <span className="text-white text-sm font-mono">
                    {formatTime(currentTime)} / {video.duration}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <Maximize className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 rounded-2xl bg-card border border-border overflow-hidden flex flex-col max-h-[400px] lg:max-h-none">
          {/* Video info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-start justify-between mb-2">
              <h2
                className="font-semibold text-foreground text-lg line-clamp-2"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {video.title}
              </h2>
              <span className={cn("px-2 py-1 rounded-full text-xs font-semibold capitalize", colors.bg, colors.text)}>
                {video.emotion}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{video.summary}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {video.duration}
              </span>
              <span>{video.date}</span>
            </div>
          </div>

          {/* Related moments */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Key Moments</h3>
            <div className="space-y-2">
              {relatedMoments.length > 0 ? (
                relatedMoments.map((moment) => {
                  const momentColors = emotionColors[moment.emotion]
                  return (
                    <button
                      key={moment.id}
                      onClick={() => setCurrentTime(moment.startTime)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors text-left"
                    >
                      <div className="relative w-16 h-10 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={moment.thumbnail || "/placeholder.svg"}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className={cn("absolute bottom-0 left-0 right-0 h-0.5", momentColors.bg)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{moment.description}</p>
                        <span className="text-xs text-muted-foreground font-mono">{formatTime(moment.startTime)}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">No key moments detected yet.</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="p-4 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {video.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
