"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Clock, Calendar, FileVideo } from "lucide-react"
import { type Video } from "@/lib/api"
import { cn } from "@/lib/utils"

interface VideoCardProps {
  video: Video
  onClick: (video: Video) => void
  viewMode?: "grid" | "list"
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

// Get status badge color
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

export function VideoCard({ video, onClick, viewMode = "grid" }: VideoCardProps) {
  const statusBadge = getStatusBadge(video.indexingStatus)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Seek to a frame when video loads
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    const handleLoadedData = () => {
      // Seek to 1 second to show a preview frame
      videoEl.currentTime = Math.min(1, (videoEl.duration || 10) * 0.1)
    }

    const handleSeeked = () => {
      setVideoLoaded(true)
    }

    const handleError = () => {
      setVideoError(true)
    }

    videoEl.addEventListener("loadeddata", handleLoadedData)
    videoEl.addEventListener("seeked", handleSeeked)
    videoEl.addEventListener("error", handleError)

    return () => {
      videoEl.removeEventListener("loadeddata", handleLoadedData)
      videoEl.removeEventListener("seeked", handleSeeked)
      videoEl.removeEventListener("error", handleError)
    }
  }, [])

  if (viewMode === "list") {
    return (
      <div
        className={cn(
          "group rounded-xl overflow-hidden bg-card border border-border cursor-pointer",
          "transition-all duration-300 hover:shadow-lg hover:border-primary/50 flex gap-4",
        )}
        onClick={() => onClick(video)}
      >
        {/* Thumbnail */}
        <div className="relative w-48 flex-shrink-0 aspect-video overflow-hidden bg-secondary rounded-lg">
        {/* Video preview */}
        {!videoError && video.storageUrl ? (
          <video
            ref={videoRef}
            src={video.storageUrl}
            muted
            playsInline
            preload="metadata"
            className={cn(
              "w-full h-full object-cover",
              !videoLoaded && "opacity-0"
            )}
          />
        ) : null}

        {/* Fallback placeholder */}
        {(videoError || !videoLoaded) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <FileVideo className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

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

        {/* Status badge */}
        <div
          className={cn(
            "absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold capitalize",
            statusBadge.bg,
            statusBadge.text,
          )}
        >
          {video.indexingStatus}
        </div>

        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/70 text-white text-xs font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(video.duration)}
          </div>
        )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-center">
          <h3 className="font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {video.originalName || video.fileName}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {video.summary || "Processing video..."}
          </p>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(video.uploadedAt)}
              </span>
              {video.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {Math.ceil(video.duration / 60)} min
                </span>
              )}
            </div>
            <span className="text-xs">
              {(video.fileSize / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Grid view (default)
  return (
    <div
      className={cn(
        "group rounded-xl overflow-hidden bg-card border border-border cursor-pointer",
        "transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50",
      )}
      onClick={() => onClick(video)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-secondary">
        {/* Video preview */}
        {!videoError && video.storageUrl ? (
          <video
            ref={videoRef}
            src={video.storageUrl}
            muted
            playsInline
            preload="metadata"
            className={cn(
              "w-full h-full object-cover",
              !videoLoaded && "opacity-0"
            )}
          />
        ) : null}

        {/* Fallback placeholder */}
        {(videoError || !videoLoaded) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <FileVideo className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

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

        {/* Status badge */}
        <div
          className={cn(
            "absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold capitalize",
            statusBadge.bg,
            statusBadge.text,
          )}
        >
          {video.indexingStatus}
        </div>

        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/70 text-white text-xs font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(video.duration)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {video.originalName || video.fileName}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {video.summary || "Processing video..."}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(video.uploadedAt)}
            </span>
            {video.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {Math.ceil(video.duration / 60)} min
              </span>
            )}
          </div>
          <span className="text-xs">
            {(video.fileSize / (1024 * 1024)).toFixed(1)} MB
          </span>
        </div>
      </div>
    </div>
  )
}
