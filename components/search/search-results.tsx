"use client"

import { useState } from "react"
import { Play, Clock, Calendar, ChevronRight, Star } from "lucide-react"
import { VideoPlayerModal } from "@/components/library/video-player-modal"
import { type Video, type SearchClip } from "@/lib/api"
import { cn } from "@/lib/utils"

interface SearchResult {
  video: Video
  relevanceScore: number
  clips: SearchClip[]
}

interface SearchResultsProps {
  results: SearchResult[]
  query: string
}

// Format duration from seconds to MM:SS
function formatDuration(seconds?: number): string {
  if (!seconds) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

// Format date for display
function formatDate(date?: string | Date): string {
  if (!date) return "Unknown date"
  const d = new Date(date)
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export function SearchResults({ results, query }: SearchResultsProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [selectedStartTime, setSelectedStartTime] = useState(0)

  const handleClipClick = (video: Video, startTime: number) => {
    setSelectedVideo(video)
    setSelectedStartTime(startTime)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
          <Play className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No results found</h3>
        <p className="text-muted-foreground">Try adjusting your search or browse your library instead.</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg text-muted-foreground">
          Found <span className="text-foreground font-semibold">{results.length} videos</span> matching {'"'}
          {query}
          {'"'}
        </h2>
      </div>

      <div className="space-y-6">
        {results.map((result, index) => {
          const videoTitle = result.video.originalName || result.video.fileName || "Untitled Video"

          return (
            <div
              key={result.video.id}
              className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col lg:flex-row">
                {/* Video Preview */}
                <div
                  className="relative lg:w-80 aspect-video lg:aspect-auto cursor-pointer group bg-secondary"
                  onClick={() => setSelectedVideo(result.video)}
                >
                  {result.video.storageUrl ? (
                    <video
                      src={result.video.storageUrl}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold capitalize bg-primary/80 text-primary-foreground">
                    {result.video.indexingStatus}
                  </div>
                  <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/70 text-white text-xs font-mono">
                    {formatDuration(result.video.duration)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3
                        className="text-xl font-semibold text-foreground mb-1 hover:text-primary cursor-pointer transition-colors"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                        onClick={() => setSelectedVideo(result.video)}
                      >
                        {videoTitle}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(result.video.uploadedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(result.video.duration)}
                        </span>
                      </div>
                    </div>

                    {/* Relevance score */}
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      <Star className="w-4 h-4 fill-primary" />
                      {Math.round(result.relevanceScore)}% match
                    </div>
                  </div>

                  {result.video.summary && (
                    <p className="text-muted-foreground mb-4">{result.video.summary}</p>
                  )}

                  {/* Matching clips */}
                  {result.clips.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Matching Clips</h4>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {result.clips.map((clip, clipIndex) => (
                          <button
                            key={clipIndex}
                            onClick={() => handleClipClick(result.video, clip.start)}
                            className="flex-shrink-0 flex items-center gap-2 p-2 rounded-lg bg-secondary/50
                              hover:bg-secondary transition-colors group/clip"
                          >
                            <div className="relative w-20 h-12 rounded overflow-hidden bg-secondary flex items-center justify-center">
                              {clip.thumbnailUrl ? (
                                <img
                                  src={clip.thumbnailUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Play className="w-6 h-6 text-muted-foreground" />
                              )}
                              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            </div>
                            <div className="text-left">
                              <p className="text-xs text-foreground">
                                {formatTime(clip.start)} - {formatTime(clip.end)}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                Score: {Math.round(clip.score)}%
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover/clip:text-foreground transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedVideo && (
        <VideoPlayerModal video={selectedVideo} startTime={selectedStartTime} onClose={() => setSelectedVideo(null)} />
      )}
    </>
  )
}
