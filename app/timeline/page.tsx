"use client"

import { useState, useMemo } from "react"
import { Loader2 } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { EmotionalChart } from "@/components/timeline/emotional-chart"
import { EmotionLegend } from "@/components/timeline/emotion-legend"
import { MilestoneDetail } from "@/components/timeline/milestone-detail"
import { TimelineStats } from "@/components/timeline/timeline-stats"
import { EmptyTimelineState } from "@/components/timeline/empty-timeline"
import { VideoPlayerModal } from "@/components/library/video-player-modal"
import { milestoneIcons, type Milestone } from "@/lib/timeline-data"
import { getEmotionColor } from "@/lib/mock-data"
import { useTimeline } from "@/hooks/use-timeline"
import { api, type Video } from "@/lib/api"
import { processTimelineDataForChart, BASE_EMOTIONS, type BaseEmotionType } from "@/lib/emotion-mapper"

export default function TimelinePage() {
  const { data, isLoading, error, refetch } = useTimeline()
  const [selectedEmotions, setSelectedEmotions] = useState<BaseEmotionType[]>(["joy", "love", "excitement", "nostalgia"])
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  // Process timeline data for chart compatibility
  const processedData = useMemo(() => {
    if (!data?.dataPoints) return [];
    return processTimelineDataForChart(data.dataPoints);
  }, [data?.dataPoints]);

  const handleToggleEmotion = (emotion: string) => {
    const e = emotion as BaseEmotionType
    setSelectedEmotions((prev) => (prev.includes(e) ? prev.filter((em) => em !== e) : [...prev, e]))
  }

  const handleViewVideo = async (videoId: string) => {
    try {
      const response = await api.getVideo(videoId);
      if (response) {
        setSelectedMilestone(null);
        setSelectedVideo(response);
      }
    } catch {
      // Failed to load video
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.dataPoints.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 px-4">
          <EmptyTimelineState />
        </main>
        <Footer />
      </div>
    );
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
          <TimelineStats summary={data.summary} />

          {/* Chart */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                Emotional Timeline
              </h2>
              <p className="text-sm text-muted-foreground">Click on milestones to explore key moments in your life</p>
            </div>

            <EmotionalChart
              data={processedData}
              milestones={data.milestones}
              selectedEmotions={selectedEmotions}
              onMilestoneClick={setSelectedMilestone}
            />

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center mb-4">Toggle emotions to filter the timeline</p>
              <EmotionLegend emotions={BASE_EMOTIONS} selectedEmotions={selectedEmotions} onToggle={handleToggleEmotion} />
            </div>
          </div>

          {/* Milestones list */}
          {data.milestones.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2
                className="text-xl font-semibold text-foreground mb-6"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Life Milestones
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.milestones.map((milestone) => {
                  const color = getEmotionColor(milestone.emotion)
                  return (
                    <button
                      key={milestone.id}
                      onClick={() => setSelectedMilestone(milestone as unknown as Milestone)}
                      className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary 
                        transition-all duration-200 text-left group"
                    >
                      <div
                        className={`w-12 h-12 rounded-full ${color?.bg || 'bg-primary'} flex items-center justify-center text-xl
                          group-hover:scale-110 transition-transform`}
                      >
                        {milestoneIcons[milestone.type as keyof typeof milestoneIcons] || "📌"}
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
          )}
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
