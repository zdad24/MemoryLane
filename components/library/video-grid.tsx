"use client"

import { useState } from "react"
import { VideoCard } from "./video-card"
import { VideoPlayerModal } from "./video-player-modal"
import { type VideoMetadata, mockVideos, type EmotionType } from "@/lib/mock-data"

interface VideoGridProps {
  videos?: VideoMetadata[]
  selectedEmotion?: EmotionType | "all"
}

export function VideoGrid({ videos = mockVideos, selectedEmotion = "all" }: VideoGridProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null)

  const filteredVideos =
    selectedEmotion === "all" ? videos : videos.filter((video) => video.emotion === selectedEmotion)

  return (
    <>
      {filteredVideos.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No videos found for this filter.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video, index) => (
            <div key={video.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <VideoCard video={video} onClick={setSelectedVideo} />
            </div>
          ))}
        </div>
      )}

      {selectedVideo && <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
    </>
  )
}
