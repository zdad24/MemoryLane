"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { VideoGrid } from "@/components/library/video-grid"
import { Search, SlidersHorizontal, Grid3X3, List, Loader2, Upload } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { api, type Video } from "@/lib/api"
import Link from "next/link"

export default function LibraryPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({})

  useEffect(() => {
    async function fetchVideos() {
      try {
        setLoading(true)
        setError(null)
        const response = await api.getVideos()
        setVideos(response.videos || [])
      } catch (err) {
        console.error("Failed to fetch videos:", err)
        setError(err instanceof Error ? err.message : "Failed to load videos")
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [])

  // Extract duration from video elements if not available in video data
  useEffect(() => {
    if (videos.length === 0) return

    const loadDurations = async () => {
      const durationMap: Record<string, number> = {}
      const promises = videos.map((video) => {
        if (video.duration && video.duration > 0) {
          durationMap[video.id] = video.duration
          return Promise.resolve()
        }

        return new Promise<void>((resolve) => {
          const videoEl = document.createElement('video')
          videoEl.preload = 'metadata'
          videoEl.src = video.storageUrl

          const handleLoadedMetadata = () => {
            if (videoEl.duration && isFinite(videoEl.duration)) {
              durationMap[video.id] = videoEl.duration
            }
            resolve()
          }

          videoEl.addEventListener('loadedmetadata', handleLoadedMetadata)
          videoEl.addEventListener('error', () => resolve())

          // Timeout after 5 seconds
          setTimeout(() => resolve(), 5000)
        })
      })

      await Promise.all(promises)
      setVideoDurations(durationMap)
    }

    loadDurations()
  }, [videos])

  // Filter videos by search query
  const filteredVideos = videos.filter((video) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      video.originalName?.toLowerCase().includes(query) ||
      video.fileName?.toLowerCase().includes(query) ||
      video.summary?.toLowerCase().includes(query)
    )
  })

  // Calculate total duration in seconds, then convert to minutes
  // Use duration from video data if available, otherwise use extracted duration from video elements
  const totalDurationSeconds = videos.reduce((acc, v) => {
    const duration = v.duration && v.duration > 0 
      ? v.duration 
      : (videoDurations[v.id] || 0)
    return acc + duration
  }, 0)
  const totalMinutes = totalDurationSeconds > 0 ? Math.ceil(totalDurationSeconds / 60) : 0

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-3xl md:text-4xl font-bold mb-2 text-foreground"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Your Memory Library
            </h1>
            <p className="text-muted-foreground">
              {videos.length} {videos.length === 1 ? "video" : "videos"} • {totalMinutes} {totalMinutes === 1 ? "minute" : "minutes"} of memories
            </p>
          </div>

          {/* Filters and search */}
          <div className="mb-8 space-y-4">
            {/* Search bar */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search your memories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-border"
                />
              </div>
              <Button variant="outline" className="border-border bg-transparent">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <div className="hidden sm:flex border border-border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="rounded-none border-0 border-r border-border last:border-r-0"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="rounded-none border-0"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading your memories...</p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && videos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
                <Upload className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3
                className="text-xl font-semibold text-foreground mb-2"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                No videos yet
              </h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Upload your first video to start building your memory library
              </p>
              <Link href="/upload">
                <Button className="bg-primary hover:bg-primary/90">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Videos
                </Button>
              </Link>
            </div>
          )}

          {/* Video grid */}
          {!loading && !error && videos.length > 0 && (
            <VideoGrid
              videos={filteredVideos}
              viewMode={viewMode}
              onVideoDeleted={(videoId) => {
                setVideos((prev) => prev.filter((v) => v.id !== videoId))
              }}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
