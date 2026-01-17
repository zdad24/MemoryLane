"use client"

import { useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { EmotionalChart } from "@/components/timeline/emotional-chart"
import { EmotionLegend } from "@/components/timeline/emotion-legend"
import { MilestoneDetail } from "@/components/timeline/milestone-detail"
import { TimelineStats } from "@/components/timeline/timeline-stats"
import { VideoPlayerModal } from "@/components/library/video-player-modal"
import { mockTimelineData, mockMilestones, milestoneIcons, type Milestone } from "@/lib/timeline-data"
import { type EmotionType, mockVideos, type VideoMetadata, emotionColors } from "@/lib/mock-data"

export default function TimelinePage() {
  const [selectedEmotions, setSelectedEmotions] = useState<EmotionType[]>(["joy", "love", "excitement", "nostalgia"])
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null)

  const handleToggleEmotion = (emotion: EmotionType) => {
    setSelectedEmotions((prev) => (prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]))
  }

  const handleViewVideo = (videoId: string) => {
    const video = mockVideos.find((v) => v.id === videoId)
    if (video) {
      setSelectedMilestone(null)
      setSelectedVideo(video)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl md:text-5xl font-bold mb-4 text-foreground"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Your Emotional Journey
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Explore how your emotions have evolved through your memories over time
            </p>
          </div>

          {/* Stats */}
          <TimelineStats />

          {/* Chart */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                Emotional Timeline
              </h2>
              <p className="text-sm text-muted-foreground">Click on milestones to explore key moments in your life</p>
            </div>

            <EmotionalChart
              data={mockTimelineData}
              milestones={mockMilestones}
              selectedEmotions={selectedEmotions}
              onMilestoneClick={setSelectedMilestone}
            />

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center mb-4">Toggle emotions to filter the timeline</p>
              <EmotionLegend selectedEmotions={selectedEmotions} onToggle={handleToggleEmotion} />
            </div>
          </div>

          {/* Milestones list */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2
              className="text-xl font-semibold text-foreground mb-6"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Life Milestones
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockMilestones.map((milestone) => {
                const color = emotionColors[milestone.emotion]
                return (
                  <button
                    key={milestone.id}
                    onClick={() => setSelectedMilestone(milestone)}
                    className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary 
                      transition-all duration-200 text-left group"
                  >
                    <div
                      className={`w-12 h-12 rounded-full ${color.bg} flex items-center justify-center text-xl
                        group-hover:scale-110 transition-transform`}
                    >
                      {milestoneIcons[milestone.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{milestone.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(milestone.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Modals */}
      {selectedMilestone && (
        <MilestoneDetail
          milestone={selectedMilestone}
          onClose={() => setSelectedMilestone(null)}
          onViewVideo={handleViewVideo}
        />
      )}

      {selectedVideo && <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
    </div>
  )
}
