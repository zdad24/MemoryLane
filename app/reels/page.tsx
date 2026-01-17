"use client"

import { useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { ReelConfig, type ReelConfiguration } from "@/components/reels/reel-config"
import { GenerationProgress } from "@/components/reels/generation-progress"
import { ReelCard } from "@/components/reels/reel-card"
import { ReelPreviewModal } from "@/components/reels/reel-preview-modal"
import { mockReels, type HighlightReel } from "@/lib/reel-data"
import { mockVideos } from "@/lib/mock-data"
import { Plus, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type ViewMode = "list" | "create" | "generating"

export default function ReelsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [reels, setReels] = useState<HighlightReel[]>(mockReels)
  const [selectedReel, setSelectedReel] = useState<HighlightReel | null>(null)
  const [pendingConfig, setPendingConfig] = useState<ReelConfiguration | null>(null)

  const handleGenerate = (config: ReelConfiguration) => {
    setPendingConfig(config)
    setViewMode("generating")
  }

  const handleGenerationComplete = () => {
    if (pendingConfig) {
      // Create new reel from config
      const newReel: HighlightReel = {
        id: (reels.length + 1).toString(),
        title: pendingConfig.title,
        duration: `${Math.floor(pendingConfig.duration / 60)}:${(pendingConfig.duration % 60).toString().padStart(2, "0")}`,
        durationSeconds: pendingConfig.duration,
        emotions: pendingConfig.emotions,
        videoCount: mockVideos.filter(
          (v) => pendingConfig.emotions.length === 0 || pendingConfig.emotions.includes(v.emotion),
        ).length,
        thumbnails: mockVideos
          .filter((v) => pendingConfig.emotions.length === 0 || pendingConfig.emotions.includes(v.emotion))
          .slice(0, 3)
          .map((v) => v.thumbnail),
        createdAt: new Date(),
        status: "completed",
      }
      setReels((prev) => [newReel, ...prev])
    }
    setPendingConfig(null)
    setViewMode("list")
  }

  const handleDeleteReel = (id: string) => {
    setReels((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {viewMode === "list" && (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                  <h1
                    className="text-3xl md:text-4xl font-bold mb-2 text-foreground"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    Highlight Reels
                  </h1>
                  <p className="text-muted-foreground">AI-generated compilations of your best moments</p>
                </div>
                <Button
                  onClick={() => setViewMode("create")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Reel
                </Button>
              </div>

              {/* Reels grid */}
              {reels.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-2xl border border-border">
                  <div className="w-20 h-20 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                    <Wand2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No highlight reels yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first AI-generated highlight reel from your memories
                  </p>
                  <Button
                    onClick={() => setViewMode("create")}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Reel
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reels.map((reel, index) => (
                    <div key={reel.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <ReelCard
                        reel={reel}
                        onPlay={() => setSelectedReel(reel)}
                        onDelete={() => handleDeleteReel(reel.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {viewMode === "create" && (
            <>
              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <button
                  onClick={() => setViewMode("list")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  &larr; Back
                </button>
                <h1
                  className="text-2xl md:text-3xl font-bold text-foreground"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  Create Highlight Reel
                </h1>
              </div>

              {/* Config panel */}
              <div className="max-w-xl mx-auto bg-card border border-border rounded-2xl p-6 md:p-8">
                <ReelConfig onGenerate={handleGenerate} isGenerating={false} />
              </div>
            </>
          )}

          {viewMode === "generating" && (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <h1
                  className="text-2xl md:text-3xl font-bold text-foreground mb-2"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  Creating Your Highlight Reel
                </h1>
                <p className="text-muted-foreground">AI is analyzing your videos and selecting the best moments</p>
              </div>

              {/* Progress */}
              <div className="bg-card border border-border rounded-2xl p-8 md:p-12">
                <GenerationProgress onComplete={handleGenerationComplete} />
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />

      {/* Preview modal */}
      {selectedReel && <ReelPreviewModal reel={selectedReel} onClose={() => setSelectedReel(null)} />}
    </div>
  )
}
