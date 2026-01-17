"use client"

import { useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { VideoGrid } from "@/components/library/video-grid"
import { EmotionFilter } from "@/components/library/emotion-filter"
import { mockVideos, type EmotionType } from "@/lib/mock-data"
import { Search, SlidersHorizontal, Grid3X3, List } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function LibraryPage() {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Calculate emotion counts
  const emotionCounts = mockVideos.reduce(
    (acc, video) => {
      acc[video.emotion] = (acc[video.emotion] || 0) + 1
      acc.all = (acc.all || 0) + 1
      return acc
    },
    {} as Record<EmotionType | "all", number>,
  )

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
              {mockVideos.length} videos • {Math.round(mockVideos.reduce((acc, v) => acc + v.durationSeconds, 0) / 60)}{" "}
              minutes of memories
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
              <div className="hidden sm:flex border border-border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Emotion filter */}
            <EmotionFilter selected={selectedEmotion} onChange={setSelectedEmotion} counts={emotionCounts} />
          </div>

          {/* Video grid */}
          <VideoGrid videos={mockVideos} selectedEmotion={selectedEmotion} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
