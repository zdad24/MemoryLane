"use client"

import { useState, useRef, useEffect } from "react"
import { X, Play, Pause, Volume2, VolumeX, Maximize, Share2, SkipForward, Clock, Calendar, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { type Video, api } from "@/lib/api"
import { type VideoMetadata } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

// Support both real Video and mock VideoMetadata types
type VideoInput = Video | VideoMetadata

// Type guard to check if the video is a real Video (has storageUrl)
function isRealVideo(video: VideoInput): video is Video {
  return 'storageUrl' in video && typeof video.storageUrl === 'string'
}

interface VideoPlayerModalProps {
  video: VideoInput
  startTime?: number
  onClose: () => void
  onDelete?: (videoId: string) => void
}

// Format duration from seconds to mm:ss
function formatDuration(seconds?: number): string {
  if (!seconds) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

// Format date to readable string
function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

// Get status badge style
function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return { bg: "bg-green-500/20", text: "text-green-400" }
    case "indexing":
      return { bg: "bg-yellow-500/20", text: "text-yellow-400" }
    case "pending":
      return { bg: "bg-blue-500/20", text: "text-blue-400" }
    case "failed":
      return { bg: "bg-red-500/20", text: "text-red-400" }
    default:
      return { bg: "bg-secondary", text: "text-secondary-foreground" }
  }
}

export function VideoPlayerModal({ video, startTime = 0, onClose, onDelete }: VideoPlayerModalProps) {
  const isReal = isRealVideo(video)

  // Extract properties based on video type
  const videoUrl = isReal ? video.storageUrl : video.thumbnail
  const videoTitle = isReal ? (video.originalName || video.fileName) : video.title
  const videoDuration = isReal ? (video.duration || 0) : video.durationSeconds
  const videoDate = isReal ? video.uploadedAt : video.date
  const videoSummary = video.summary
  const videoTranscript = isReal ? video.transcript : undefined
  const videoFileSize = isReal ? video.fileSize : 0
  const indexingStatus = isReal ? video.indexingStatus : 'completed'

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(startTime)
  const [duration, setDuration] = useState(videoDuration)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(80)
  const [showControls, setShowControls] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const statusBadge = getStatusBadge(indexingStatus)

  // Sync video element with state
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    if (isPlaying) {
      videoEl.play().catch(() => setIsPlaying(false))
    } else {
      videoEl.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    videoEl.volume = volume / 100
    videoEl.muted = isMuted
  }, [volume, isMuted])

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

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      if (startTime > 0) {
        videoRef.current.currentTime = startTime
      }
    }
  }

  const handleSeek = (value: number[]) => {
    const newTime = (value[0] / 100) * duration
    setCurrentTime(newTime)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this video?")) return

    setIsDeleting(true)
    try {
      await api.deleteVideo(video.id)
      onDelete?.(video.id)
      onClose()
    } catch {
      alert("Failed to delete video")
    } finally {
      setIsDeleting(false)
    }
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

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
          <div className="relative aspect-video bg-black">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              onClick={() => setIsPlaying(!isPlaying)}
            />

            {/* Play/Pause overlay */}
            {!isPlaying && (
              <button
                onClick={() => setIsPlaying(true)}
                className={cn(
                  "absolute inset-0 flex items-center justify-center transition-opacity",
                  showControls ? "opacity-100" : "opacity-0",
                )}
              >
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                  <Play className="w-10 h-10 text-white ml-1" />
                </div>
              </button>
            )}

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
                onValueChange={handleSeek}
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
                    onClick={() => {
                      const newTime = Math.min(currentTime + 10, duration)
                      setCurrentTime(newTime)
                      if (videoRef.current) videoRef.current.currentTime = newTime
                    }}
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
                    {formatDuration(currentTime)} / {formatDuration(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => videoRef.current?.requestFullscreen()}
                  >
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
                {videoTitle}
              </h2>
              <span className={cn("px-2 py-1 rounded-full text-xs font-semibold capitalize", statusBadge.bg, statusBadge.text)}>
                {indexingStatus}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {videoSummary || "Video is being processed..."}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(duration)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(videoDate)}
              </span>
            </div>
          </div>

          {/* Transcript section */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Transcript</h3>
            {videoTranscript ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{videoTranscript}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {indexingStatus === "completed"
                  ? "No transcript available."
                  : "Transcript will be available after processing."}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between">
              {videoFileSize > 0 && (
                <div className="text-xs text-muted-foreground">
                  {(videoFileSize / (1024 * 1024)).toFixed(1)} MB
                </div>
              )}
              {isReal && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
