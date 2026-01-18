"use client"

import { useState } from "react"
import { VideoCard } from "./video-card"
import { VideoPlayerModal } from "./video-player-modal"
import { type Video } from "@/lib/api"

interface VideoGridProps {
  videos: Video[]
  viewMode?: "grid" | "list"
  onVideoDeleted?: (videoId: string) => void
}

export function VideoGrid({ videos, viewMode = "grid", onVideoDeleted }: VideoGridProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  const handleDelete = (videoId: string) => {
    setSelectedVideo(null)
    onVideoDeleted?.(videoId)
  }

  return (
    <>
      {videos.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No videos found.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video, index) => (
            <div key={video.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <VideoCard video={video} onClick={setSelectedVideo} viewMode="grid" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video, index) => (
            <div key={video.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <VideoCard video={video} onClick={setSelectedVideo} viewMode="list" />
            </div>
          ))}
        </div>
      )}

      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}
