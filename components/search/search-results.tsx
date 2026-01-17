"use client"

import { useState } from "react"
import { Play, Clock, Calendar, ChevronRight, Star } from "lucide-react"
import { VideoPlayerModal } from "@/components/library/video-player-modal"
import { type VideoMetadata, emotionColors, type Moment } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface SearchResult {
  video: VideoMetadata
  relevanceScore: number
  matchingMoments: Moment[]
}

interface SearchResultsProps {
  results: SearchResult[]
  query: string
}

export function SearchResults({ results, query }: SearchResultsProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null)
  const [selectedStartTime, setSelectedStartTime] = useState(0)

  const handleMomentClick = (video: VideoMetadata, startTime: number) => {
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
          const colors = emotionColors[result.video.emotion]

          return (
            <div
              key={result.video.id}
              className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col lg:flex-row">
                {/* Thumbnail */}
                <div
                  className="relative lg:w-80 aspect-video lg:aspect-auto cursor-pointer group"
                  onClick={() => setSelectedVideo(result.video)}
                >
                  <img
                    src={result.video.thumbnail || "/placeholder.svg"}
                    alt={result.video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </div>
                  </div>

                  {/* Badges */}
                  <div
                    className={cn(
                      "absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold capitalize",
                      colors.bg,
                      colors.text,
                    )}
                  >
                    {result.video.emotion}
                  </div>
                  <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/70 text-white text-xs font-mono">
                    {result.video.duration}
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
                        {result.video.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {result.video.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {result.video.duration}
                        </span>
                      </div>
                    </div>

                    {/* Relevance score */}
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      <Star className="w-4 h-4 fill-primary" />
                      {Math.round(result.relevanceScore * 100)}% match
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4">{result.video.summary}</p>

                  {/* Matching moments */}
                  {result.matchingMoments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Matching Moments</h4>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {result.matchingMoments.map((moment) => {
                          const momentColors = emotionColors[moment.emotion]
                          return (
                            <button
                              key={moment.id}
                              onClick={() => handleMomentClick(result.video, moment.startTime)}
                              className="flex-shrink-0 flex items-center gap-2 p-2 rounded-lg bg-secondary/50 
                                hover:bg-secondary transition-colors group/moment"
                            >
                              <div className="relative w-20 h-12 rounded overflow-hidden">
                                <img
                                  src={moment.thumbnail || "/placeholder.svg"}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                                <div className={cn("absolute bottom-0 left-0 right-0 h-0.5", momentColors.bg)} />
                              </div>
                              <div className="text-left">
                                <p className="text-xs text-foreground line-clamp-1 max-w-[120px]">
                                  {moment.description}
                                </p>
                                <span className="text-xs text-muted-foreground font-mono">
                                  {formatTime(moment.startTime)}
                                </span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover/moment:text-foreground transition-colors" />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {result.video.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
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
